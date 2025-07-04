import firebase_admin.auth
import aio_pika
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
import asyncio
import firebase_admin
from firebase_admin import credentials, auth
import json as JSON
import os


cred = credentials.Certificate("./serviceAccountKey.json")
firebaseApp = firebase_admin.initialize_app(cred)

if firebaseApp:
    print("Firebase initialized successfully")
else:
    print("Failed to initialize Firebase")
message_log = []

def clear():
    os.system("cls" if os.name == "nt" else "clear")


def get_user_from_token(token: str):
    try:
        decoded_token = firebase_admin.auth.verify_id_token(token)
        return decoded_token
    except firebase_admin.auth.InvalidIdTokenError:
        print("Invalid token")
        return None


def print_message_log():
    print("Message Log:")
    for entry in message_log:
        print(f"{entry['display_name']}:",f"{entry['message']}")

async def consume_rabbitmq():
    connection = await aio_pika.connect_robust("amqp://localhost/")
    channel = await connection.channel()
    queue = await channel.declare_queue("chat-messages", durable=True)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                json_data = JSON.loads(message.body.decode())
                msg_text = json_data.get("message")
                tokenId = json_data.get("tokenId")
                response = {'status': 'ok', 'message': 'Received!'}
                user = get_user_from_token(tokenId)
                if user:
                    user_get = firebase_admin.auth.get_user(user.get("uid"))
                    entry = {
                        "userId": user["uid"],
                        "display_name": user_get.display_name or "Unknown",
                        "email": user["email"],
                        "message": msg_text,
                    }
                    clear()
                    message_log.append(entry)
                    print(f"✅ Mensagem recebida: {entry}")
                    print_message_log()
                    response.update({
                        'status': '200',
                        'message': f'Message from {user.get('email')} processed successfully.'
                    })
                    await broadcast_to_clients(entry)
                else:
                    print("⚠️ Token inválido")
                    response.update({
                        'status': '401',
                        'message': 'Unauthorized. Message not processed.'
                    })
                if message.reply_to:
                    await channel.default_exchange.publish(
                        aio_pika.Message(
                            body=JSON.dumps(response).encode(),
                            correlation_id=message.correlation_id
                        ),
                        routing_key=message.reply_to
                    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(consume_rabbitmq())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print("✅ consume_rabbitmq task cancelled cleanly.")

app = FastAPI(lifespan=lifespan)

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
    await websocket.accept()
    websocket_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Mantém a conexão viva
    except WebSocketDisconnect:
        websocket_clients.remove(websocket)


async def broadcast_to_clients(message_dict):
    to_remove = []
    for ws in websocket_clients:
        try:
            await ws.send_text(JSON.dumps(message_dict))
        except:
            to_remove.append(ws)
    for ws in to_remove:
        websocket_clients.remove(ws)



@app.get("/messages")
async def get_messages():
    return JSONResponse(content=message_log)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)