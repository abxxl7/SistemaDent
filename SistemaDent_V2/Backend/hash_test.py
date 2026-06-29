import bcrypt

password = b"admin123"
nuevo_hash = bcrypt.hashpw(password, bcrypt.gensalt())
print("Nuevo hash:", nuevo_hash.decode())

# Verificar que el hash funciona
es_valido = bcrypt.checkpw(password, nuevo_hash)
print("Hash válido:", es_valido)