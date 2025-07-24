from fastapi import APIRouter
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
