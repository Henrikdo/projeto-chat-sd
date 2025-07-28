from fastapi import APIRouter,Body,Request, HTTPException, status
import firebase_admin
from firebase_admin import credentials, auth
from models.message_model import Message
from db.mongo import messages_collection
from fastapi.responses import JSONResponse
from bson import ObjectId

router = APIRouter()

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

async def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    print("Authorization header:", auth_header)  # Log do header recebido

    if not auth_header or not auth_header.startswith("Bearer "):
        print("Authorization header inválido ou ausente")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]
    print("Token extraído:", token)

    try:
        decoded_token = auth.verify_id_token(token)
        print("Token decodificado com sucesso:", decoded_token)
        return decoded_token  # contém uid, email, etc.
    except Exception as e:
        print("Erro ao verificar token:", str(e))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")



@router.get("/messages")
async def get_messages():
    messages = []
    cursor = messages_collection.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        messages.append(document)
    return JSONResponse(content=messages)

@router.put("/messages/update-photo")
async def update_user_photo(
    uuid: str = Body(...),
    new_photo_url: str = Body(...)
):
    try:
        print(f"🔄 Recebida requisição para atualizar photoURL:")
        print(f"   ➤ UUID: {uuid}")
        print(f"   ➤ Nova URL: {new_photo_url}")

        # Verifica quantos documentos existem antes da modificação
        existing = await messages_collection.count_documents({"uuid": uuid})
        print(f"   ➤ Mensagens encontradas com uuid '{uuid}': {existing}")

        result = await messages_collection.update_many(
            {"userId": uuid},
            {
                "$set": {"photoUrl": new_photo_url},
                "$unset": {"photoURL": ""}
            }

            
        )

        print(f"✅ Atualização concluída:")
        print(f"   ➤ matched: {result.matched_count}")
        print(f"   ➤ modified: {result.modified_count}")

        return JSONResponse(
            content={
                "message": "Photo URL updated successfully.",
                "matched": result.matched_count,
                "modified": result.modified_count
            },
            status_code=200
        )

    except Exception as e:
        print(f"❌ Erro ao atualizar photoURL: {e}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
    

@router.delete("/messages/{id}")
async def delete_message(id: str, request: Request):
    decoded_token = await verify_token(request)
    user_id = decoded_token["uid"]

    # (Opcional) Verifica se a mensagem pertence ao usuário
    message = await messages_collection.find_one({"_id": ObjectId(id)})
    if not message:
        return JSONResponse(content={"error": "Message not found"}, status_code=404)
    if message.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    result = await messages_collection.delete_one({"_id": ObjectId(id)})
    return {"message": "Message deleted"} if result.deleted_count else JSONResponse(content={"error": "Message not found"}, status_code=404)


@router.put("/messages/{id}")
async def edit_message(id: str, request: Request, updated: dict = Body(...)):
    decoded_token = await verify_token(request)
    user_id = decoded_token["uid"]

    message = await messages_collection.find_one({"_id": ObjectId(id)})
    if not message:
        return JSONResponse(content={"error": "Message not found"}, status_code=404)
    if message.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")

    result = await messages_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": updated}
    )
    return {"message": "Message updated"} if result.modified_count else JSONResponse(content={"error": "No changes made"}, status_code=400)
