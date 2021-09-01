import socket
import json
import time
from cryptography.fernet import Fernet
import ast

HEADER = 64
FILE_PORT = 5000
AUTHENTICATION_PORT = 5500
FORMAT = 'utf-8'
DISCONNECT_MESSAGE = '!DICONNECT'
SERVER = "192.168.1.5"
FILE_ADDR = (SERVER, FILE_PORT)
AUTHENTICATION_ADDR = (SERVER, AUTHENTICATION_PORT)
CLIENT_ID = None
FILE_ID = None
CLIENT_PASSWORD = None
CLIENT_LOGIN_INFO = None
CLIENT_SECRET_KEY = None
SESSION_KEY = None
SESSION_CIPHER = None


file_client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
kdc_client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

def authenticate_client(username, password):

    if username in CLIENT_LOGIN_INFO:

        if CLIENT_LOGIN_INFO[username] == password: 
            return True
        
        else:
            return False

    else:
        return False

def generate_nonce():

    return str(time.time()*1000000)

def encrypt_message(msg, cipher):

    return cipher.encrypt(msg.encode()).decode()

def decrypt_message(msg, cipher):

    return cipher.decrypt(msg.encode()).decode()

def send_message_to_server(client, msg):

    message = msg.encode(FORMAT)
    # print(msg)
    msg_length = len(msg)
    send_length = str(msg_length).encode(FORMAT)
    send_length += b' ' * (HEADER-len(send_length))
    client.send(send_length)
    client.send(message)

def recieve_message_from_server(client):

    msg_length = client.recv(HEADER).decode(FORMAT)

    while not msg_length:
        msg_length = client.recv(HEADER).decode(FORMAT)

    msg = client.recv(int(msg_length)).decode(FORMAT)

    return msg

def setup_session():

    global SESSION_KEY, SESSION_CIPHER

    kdc_client.connect(AUTHENTICATION_ADDR)
    file_client.connect(FILE_ADDR)

    kdc_cipher = Fernet(CLIENT_SECRET_KEY)
    send_message_to_server(file_client, CLIENT_ID)
    msg2 = recieve_message_from_server(file_client)
    RA1 = generate_nonce()
    msg3 = str([RA1, CLIENT_ID, FILE_ID, msg2])
    send_message_to_server(kdc_client, msg3)
    msg4 = recieve_message_from_server(kdc_client)
    msg4 = kdc_cipher.decrypt(msg4.encode()).decode()
    msg4 = ast.literal_eval(msg4)

    if RA1 != msg4[0]:
        print('[ERROR] KDC authentication failed !! please try again')
        exit()

    SESSION_KEY = msg4[2].encode()
    SESSION_CIPHER = Fernet(SESSION_KEY)
    
    RA2 = generate_nonce()

    encrypted_ra2_nonce = SESSION_CIPHER.encrypt(RA2.encode()).decode()

    msg5 = str([encrypted_ra2_nonce, msg4[3]])

    send_message_to_server(file_client, msg5)

    msg6 = recieve_message_from_server(file_client)

    if msg6 == 'failure':
        print('[ERROR] Failed to setup session key !!')
        exit()

    msg6 = SESSION_CIPHER.decrypt(msg6.encode()).decode()
    
    [file_ra2, RB2] = ast.literal_eval(msg6)

    if float(file_ra2) != float(RA2)-1 :
        print('[ERROR] Failed to authenticate the file server !!')
        exit()

    msg7 = SESSION_CIPHER.encrypt(str(float(RB2)-1).encode()).decode()
    
    send_message_to_server(file_client,msg7)

    ack_msg = SESSION_CIPHER.decrypt(recieve_message_from_server(file_client).encode()).decode()

    if ack_msg == 'YES':
        print('[CONNECTED] The client is now successfully connected to the file server !!')
        print(f'Session Key generated: {SESSION_KEY.decode()}')
    
    else:
        print('[ERROR] Failed to authenticate the file server !!')
        exit()

def main():

    global CLIENT_LOGIN_INFO, CLIENT_ID ,CLIENT_PASSWORD, FILE_ID, CLIENT_SECRET_KEY

    client_passwords_file = open('C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\\client_passwords.txt', "r")
    CLIENT_LOGIN_INFO = json.load(client_passwords_file)

    CLIENT_ID = input("Please enter your username: ")
    CLIENT_PASSWORD = input("Please enter your password: ")

    if not authenticate_client(CLIENT_ID, CLIENT_PASSWORD):
        print("[ERROR] Client authentication unsucessfull please try again !")
        exit()

    else:
        print("[SUCCESS] Client sucessfully authenticated..")
        client_secret_keys_file = open('C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\\client_secret_keys.txt', "r")
        CLIENT_SECRET_KEY = json.load(client_secret_keys_file)[CLIENT_ID].encode()

    FILE_ID = input("Please enter the FileId you want to connect to: ")
    FILE_ID = f'file{FILE_ID}'

    setup_session()
    print("[CONNECTED] Client is connected to Server") 
    print("Enter 'exit' to quit")   
    cmd = input(">>")

    while cmd != 'exit':
        cmd = SESSION_CIPHER.encrypt(cmd.encode()).decode()
        send_message_to_server(file_client, cmd)
        msg = recieve_message_from_server(file_client)
        msg = SESSION_CIPHER.decrypt(msg.encode()).decode()
        print(msg)
        cmd = input(">>")

    send_message_to_server(file_client, encrypt_message('!DISCONNECT', SESSION_CIPHER))
        


if __name__ == "__main__":
    main()