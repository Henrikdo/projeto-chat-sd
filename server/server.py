import firebase_admin.auth
import aio_pika
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
import asyncio
import json as JSON
import os
from models.message_model import Message
from db.mongo import messages_collection
from datetime import datetime
from routes import messages
from bson import ObjectId


message_log = []

def clear():
    os.system("cls" if os.name == "nt" else "clear")


def print_message_log():
    print("Message Log:")
    for entry in message_log:
        print(f"{entry['display_name']}:",f"{entry['message']}")
        if entry.get("imageUrl"):
            print(f"Image URL: {entry['imageUrl']}")

async def consume_rabbitmq():
    try:
        connection = await aio_pika.connect_robust("amqp://localhost/")
        channel = await connection.channel()
        queue = await channel.declare_queue("chat-messages", durable=True)

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    json_data = JSON.loads(message.body.decode())
                    msg_text = json_data.get("message")
                    imageUrl = json_data.get("imageUrl")
                    userId = json_data.get("userId")
                    photoUrl = json_data.get("photoUrl")
                    displayName = json_data.get("displayName")
                    response = {'status': 'ok', 'message': 'Received!'}

                    entry = {
                            "userId": userId,
                            "display_name": displayName or "Unknown",
                            "message": msg_text,
                            "imageUrl": imageUrl if imageUrl else None,
                            "photoUrl": photoUrl if photoUrl else None,
                            "timestamp": datetime.now().isoformat()
                        }
                    message_log.append(entry)
                    print(f"✅ Mensagem recebida: {entry}")
                    await messages_collection.insert_one(entry)
                    response.update({
                            'status': '200',
                            'message': f'Message from {json_data.get("userId")} processed and saved successfully.'
                    })
                    await broadcast_to_clients(entry)
                    if message.reply_to:
                        await channel.default_exchange.publish(
                            aio_pika.Message(
                                body=JSON.dumps(response).encode(),
                                correlation_id=message.correlation_id
                            ),
                            routing_key=message.reply_to
                        )
    except Exception as e:
        print("❌ Erro ao iniciar consumo do RabbitMQ:", e)           


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⚙️ Iniciando lifespan")
    task = asyncio.create_task(consume_rabbitmq())
    try:
        yield
    finally:
        print("🛑 Finalizando lifespan")
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print("✅ Tarefa de consumo cancelada")

app = FastAPI(lifespan=lifespan)
app.include_router(messages.router)

# Para permitir conexões do React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou especifique: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

websocket_clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = id(websocket)
    print(f"🔌 NOVA CONEXÃO WebSocket - ID: {client_id}")
    
    await websocket.accept()
    websocket_clients.append(websocket)
    print(f"✅ Cliente {client_id} ACEITO e ADICIONADO à lista")
    print(f"📊 Total de clientes conectados: {len(websocket_clients)}")
    
    try:
        while True:
            try:
                # Usar timeout para evitar bloqueio indefinido
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                print(f"📨 Dados recebidos do cliente {client_id}: {data}")
            except asyncio.TimeoutError:
                # Timeout é normal - apenas continua o loop
                print(f"⏰ Timeout para cliente {client_id} (normal)")
                continue
                
    except WebSocketDisconnect:
        print(f"🔌 Cliente {client_id} DESCONECTOU")
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)
            print(f"🗑️ Cliente {client_id} removido da lista")
        print(f"📊 Clientes restantes: {len(websocket_clients)}")
        
    except Exception as e:
        print(f"❌ ERRO na conexão WebSocket {client_id}: {type(e).__name__}: {str(e)}")
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)
            print(f"🗑️ Cliente {client_id} removido devido ao erro")
        print(f"📊 Clientes restantes: {len(websocket_clients)}")

def serialize_message(message_dict):
    """Converte ObjectId e outros tipos não serializáveis para JSON"""
    serialized = {}
    for key, value in message_dict.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)  # Converter ObjectId para string
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()  # Converter datetime para string ISO
        else:
            serialized[key] = value
    return serialized

async def broadcast_to_clients(message_dict):
    print(f"🔄 INICIANDO BROADCAST")
    print(f"📊 Clientes conectados: {len(websocket_clients)}")
    print(f"📤 Mensagem original: {message_dict}")
    
    if not websocket_clients:
        print("⚠️ NENHUM CLIENTE WEBSOCKET CONECTADO!")
        return
    
    # CORREÇÃO: Serializar a mensagem antes de enviar
    try:
        serialized_message = serialize_message(message_dict)
        print(f"✅ Mensagem serializada: {serialized_message}")
        json_message = JSON.dumps(serialized_message)
        print(f"📝 JSON final: {json_message}")
    except Exception as e:
        print(f"❌ ERRO na serialização: {e}")
        return
    
    to_remove = []
    successful_sends = 0
    
    for i, ws in enumerate(websocket_clients):
        print(f"📨 Tentando enviar para cliente {i}...")
        try:
            # Verificar se a conexão ainda está ativa
            if ws.client_state.name != 'CONNECTED':
                print(f"❌ Cliente {i} não está conectado (estado: {ws.client_state.name})")
                to_remove.append(ws)
                continue
            
            # Enviar a mensagem já serializada
            await ws.send_text(json_message)
            successful_sends += 1
            print(f"✅ Mensagem enviada com SUCESSO para cliente {i}")
            
        except Exception as e:
            print(f"❌ ERRO ao enviar para cliente {i}: {type(e).__name__}: {str(e)}")
            to_remove.append(ws)
    
    # Remove conexões mortas
    if to_remove:
        print(f"🧹 Removendo {len(to_remove)} conexões mortas...")
        for ws in to_remove:
            if ws in websocket_clients:
                websocket_clients.remove(ws)
    
    print(f"📊 BROADCAST FINALIZADO:")
    print(f"   ✅ Sucessos: {successful_sends}")
    print(f"   ❌ Falhas: {len(to_remove)}")
    print(f"   🔌 Clientes ativos restantes: {len(websocket_clients)}")
    print(f"{'='*50}")




# @app.get("/messages")
# async def get_messages():
#     return JSONResponse(content=message_log)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)