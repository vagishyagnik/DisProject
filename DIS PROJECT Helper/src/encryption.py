from cryptography.fernet import Fernet
import json
import ast

msg = "['1603995717897076.2', 'client1', 'file1', 'gAAAAABfmwhFgNAEuR-Vr7kQU1Xn8OfB1at_OoR8CkD9jlK28lcrPyPELUoM93wj3vcMrkwrx8UicjBxDjiqrmeIpf6luQm5sM7B03rBaIfL7NYvNy32gTY=']"
# print(json.loads(msg))
print(ast.literal_eval(msg))
# key1 = Fernet.generate_key().decode()
# print(key1)
# msg = 'Vagish'
# cipher = Fernet(key1)
# msg = cipher.encrypt(msg.encode())
# msg = cipher.decrypt(msg)
# print(msg)
# key2 = Fernet.generate_key().decode()

# tgs_secret_key = open(r'C:\\Users\\Captan PC\\Desktop\\Items\\Study Mat\\7th Sem\\DIS PROJECT\\keys\tgs_secret_key.txt', "w")

# tgs_secret_key.write(key1)


# client_secret_key_file = open(r'C:\Users\DELL\Desktop\DIS PROJECT\keys\client_secret_keys.txt', "w")

# json.dump(keys, client_secret_key_file)

# client_secret_key_file.close()

# client_secret_key_file = open('C:\\Users\\Ayush\\Desktop\\NLP\\DIS PROJECT\\keys\\client_secret_keys.txt', "r")

# secret_keys = json.loads(client_secret_key_file.read())

# print(secret_keys['client1'].encode())
# print(type(secret_keys))

# client_secret_key_file.close()