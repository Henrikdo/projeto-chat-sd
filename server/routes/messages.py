from fastapi import APIRouter,Body
from models.message_model import Message
from db.mongo import messages_collection
from fastapi.responses import JSONResponse


router = APIRouter()


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