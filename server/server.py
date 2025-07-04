from fastapi import FastAPI
import firebase_admin.auth
from pydantic import BaseModel
import pika
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

def callback(ch, method, props, body):
    json = JSON.loads(body.decode())
    message = json.get('message')
    tokenId = json.get('tokenId')

    response = {'status': 'ok', 'message': 'Received!'}
    
    
    
    user = get_user_from_token(json.get('tokenId'))


    if user:
        user_get = firebase_admin.auth.get_user(user.get('uid'))
        message_log.append({
            'userId': user.get('uid'),
            'display_name': user_get.display_name if user_get.display_name else 'Unknown',
            'email': user.get('email'),
            'message': message
        })
        clear()
        print(f"Received message from {user_get.display_name}: ", message)
        print_message_log()
        response.update({
            'status': '200',
            'message': f'Message from {user.get('email')} processed successfully.'
        })
    else:
        print(f"Invalid token ID: {tokenId}. Message not processed.")
        response.update({
            'status': '401',
            'message': 'Unauthorized. Message not processed.'
        })
    ch.basic_publish(
        exchange='',
        routing_key=props.reply_to,
        properties=pika.BasicProperties(correlation_id=props.correlation_id),
        body=JSON.dumps(response)
    )
    ch.basic_ack(delivery_tag=method.delivery_tag)

connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='chat-messages', durable=True)
channel.basic_consume(queue='chat-messages', on_message_callback=callback, auto_ack=False)



print("Waiting for messages. Press CTRL+C to exit.")
channel.start_consuming()