import socket
import threading 
import os
from pprint import pprint
import subprocess
from cryptography.fernet import Fernet
import time
import json
import ast

HEADER = 64
PORT = 5000
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
DISCONNECT_MESSAGE = '!DISCONNECT'
CLIENT_NONCE_PAIR = dict()
SECRET_KEY = None

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)

def encrypt(message: bytes, key: bytes) -> bytes:
    return Fernet(key).encrypt(message)

def decrypt(token: bytes, key: bytes) -> bytes:
    return Fernet(key).decrypt(token)

def ls():

    PATH = os.getcwd()
    result = str(os.listdir())
    return result

def pwd():

    return os.getcwd()

def cat(file_name):

    pass
    PATH = os.getcwd()
    FILE_PATH = PATH + f'\\{file_name}.txt'
    file = open(FILE_PATH, 'r')
    text = file.read()
    file.close()
    print(text)
    return text

def cp(ori_file_name, cp_file_name):

    msg = None
    PATH = os.getcwd()
    ori_file = open(f'{PATH}/{ori_file_name}.txt', "r")
    cp_file = open(f'{PATH}/{cp_file_name}.txt', "w")

    if not ori_file or not cp_file: 
        msg = "[ERROR] File not found !!"

    else:
        msg = "Copied successfully"

    cp_file.write(ori_file.read())
    cp_file.close()
    ori_file.close()
    return msg

def generate_nonce():

    nonce = str(time.time()*1000000)
    return nonce

def recieve_message_from_client(conn):

    msg_length = conn.recv(HEADER).decode()

    while not msg_length:
        print(msg_length)
        msg_length = conn.recv(HEADER).decode()
    
    msg = conn.recv(int(msg_length)).decode()

    return msg

def send_message_to_client(msg, conn):

    message = msg.encode(FORMAT)
    msg_length = len(message)
    send_length = str(msg_length).encode(FORMAT)
    send_length += b' ' * (HEADER - len(send_length))
    conn.send(send_length)
    conn.send(message)

def encrypt_message(msg, cipher):

    if not msg:
        return msg
    
    return cipher.encrypt(msg.encode()).decode()

def decrypt_message(msg, cipher):

    return cipher.decrypt(msg.encode()).decode()

def authenticate_client(conn):

    global CLIENT_NONCE_PAIR
    kdc_cipher = Fernet(SECRET_KEY)
    RB1 = generate_nonce()
    msg1 = recieve_message_from_client(conn)
    client_id = msg1
    msg2 = kdc_cipher.encrypt(RB1.encode()).decode()
    send_message_to_client(msg2, conn)
    msg5 = ast.literal_eval(recieve_message_from_client(conn))

    msg5_sec_part = ast.literal_eval(kdc_cipher.decrypt(msg5[1].encode()).decode())

    [client_id, session_key, client_rb1] = msg5_sec_part
    session_cipher = Fernet(session_key.encode())

    if RB1 != client_rb1:
        send_message_to_client('failure', conn)
        return False, None

    RA2 = session_cipher.decrypt(msg5[0].encode()).decode()
    RB2 = generate_nonce()

    msg6 = session_cipher.encrypt(str([str(float(RA2)-1), RB2]).encode()).decode()
    send_message_to_client(msg6, conn)

    msg7 = recieve_message_from_client(conn)

    client_rb2 = float(session_cipher.decrypt(msg7.encode()).decode())

    if client_rb2 == float(RB2)-1:
        ack_msg = session_cipher.encrypt(b'YES').decode()
        send_message_to_client(ack_msg, conn)

    else:
        ack_msg = session_cipher.encrypt(b'NO').decode()
        send_message_to_client(ack_msg, conn)
        return False, None

    return True, session_cipher



def handle_client(conn, addr):

    print(f"[NEW CONNECTION] Authenticating Client : {addr}...")

    connected = True
    (authenticated, session_cipher) = authenticate_client(conn)

    if authenticated: 
        print(f"[SUCCESS] Client : {addr} authenticated successfully")

    else:
        print(f"[FAILURE] Client : {addr} authenticated successfully")

    while connected and authenticated:

        msg = recieve_message_from_client(conn)
        msg = session_cipher.decrypt(msg.encode()).decode()

        if(msg == DISCONNECT_MESSAGE):
            connected = False

        else:

            if msg == 'ls':
                send_message_to_client(encrypt_message(ls(), session_cipher), conn)

            elif msg == 'pwd':
                send_message_to_client(encrypt_message(pwd(), session_cipher), conn)
                
            elif msg.startswith('cat'):
                file_name = msg.split(' ')[1]
                send_message_to_client(encrypt_message(cat(file_name), session_cipher), conn)

            elif msg.startswith('cp'):
                [file1, file2] = msg.split(' ')[1:]
                client_msg = cp(file1, file2)
                send_message_to_client(encrypt_message(client_msg, session_cipher), conn)  

            else:
                print(msg)
                ERROR_MESSAGE = '[ERROR] Command not found'
                send_message_to_client(encrypt_message(ERROR_MESSAGE, session_cipher), conn)  


    conn.close()
    print(f"[CONNECTION CLOSED] {addr} disconnected")
    print(f"[ACTIVE CONNECTIONS] {threading.activeCount()-2}")

def start():
    server.listen()
    print(f"[LISTENING] Server is listening on {SERVER}")

    while True:
        conn, addr = server.accept()
        thread = threading.Thread(target=handle_client, args=(conn, addr)) 
        thread.start()
        print(f"[ACTIVE CONNECTIONS] {threading.activeCount()-1}")


def main():

    global SECRET_KEY

    server_number = input("Enter the file server number : ")
    print("[STARTING] Server is starting")

    fileserver_secret_key_file = open('C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\\fileserver_secret_key.txt', "r")
    SECRET_KEY = json.load(fileserver_secret_key_file)[f'file{server_number}'].encode()

    PATH = ''

    if(server_number == 2):
        PATH = 'C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\working directory\\Server 2'

    else:
        PATH = 'C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\working directory\\Server 1'

    os.chdir(PATH)

    start()

if __name__ == "__main__":
    main()