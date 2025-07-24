import asyncio
from db.mongo import messages_collection

async def test():
    cursor = messages_collection.find({})
    count = 0
    async for doc in cursor:
        print(doc)
        count += 1
    print(f"Total docs: {count}")

asyncio.run(test())