# Made by Ayushdeep and Chirag

import ast
import socket
import threading
import json
from cryptography.fernet import Fernet

HEADER = 64
PORT = 5500
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
CLIENT_SECRET_KEYS = None
FILE_SECRET_KEYS = None

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)

def generate_key():

    return Fernet.generate_key()

def send_message_to_client(msg, conn):

    message = msg.encode(FORMAT)
    msg_length = len(message)
    send_length = str(msg_length).encode(FORMAT)
    send_length += b' ' * (HEADER - len(send_length))
    conn.send(send_length)
    conn.send(message)

def recieve_message_from_client(conn):

    msg_length = conn.recv(HEADER).decode()

    while not msg_length:
        msg_length = conn.recv(HEADER).decode()
    
    msg = conn.recv(int(msg_length)).decode()

    return msg


def authenticate_client(conn, addr):

    print(f"[NEW CONNECTION]  Client : {addr} connected")

    msg3 = recieve_message_from_client(conn)
    msg3 = ast.literal_eval(msg3)
    [ra1_nonce, client_id, file_id, encrypted_rb1_nonce] = msg3

    client_secret_key = CLIENT_SECRET_KEYS[client_id].encode()
    file_secret_key = FILE_SECRET_KEYS[file_id].encode()

    client_cipher = Fernet(client_secret_key)
    file_cipher = Fernet(file_secret_key)

    rb1_nonce = file_cipher.decrypt(encrypted_rb1_nonce.encode()).decode()
    session_key = generate_key().decode()

    msg4_sec_part = file_cipher.encrypt(str([client_id, session_key, rb1_nonce]).encode()).decode()
    msg4 = client_cipher.encrypt(str([ra1_nonce, file_id, session_key, msg4_sec_part]).encode()).decode()    

    send_message_to_client(msg4, conn)

    conn.close()

    print(f"[CONNECTION CLOSED]  Client : {addr} disconnected")
    print(f"[ACTIVE CONNECTIONS] {threading.activeCount()-2}")

def start():

    server.listen()
    print(f"[LISTENING] Key Distribution Server started on port {PORT}")

    while True:
        conn, addr = server.accept()
        thread = threading.Thread(target=authenticate_client, args=(conn, addr)) 
        thread.start()

def main():

    global CLIENT_SECRET_KEYS, FILE_SECRET_KEYS
    client_secret_keys_file = open('C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\\client_secret_keys.txt', "r")
    fileserver_secret_keys_file = open('C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\\fileserver_secret_key.txt', "r")
    
    CLIENT_SECRET_KEYS = json.load(client_secret_keys_file)
    FILE_SECRET_KEYS = json.load(fileserver_secret_keys_file)

    start()

if __name__ == "__main__":
    main()

