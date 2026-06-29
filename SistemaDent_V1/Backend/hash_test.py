from passlib.context import CryptContext

ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Verificar el hash existente
hash_existente = "$2b$12$KIX9mFbNPGiCEkjFuL7GCOzQfVdRkwPk1Ggz5VHqCLHuSqzOcDBsK"
print("Hash válido:", ctx.verify('admin123', hash_existente))

# Generar un hash nuevo para admin123
nuevo_hash = ctx.hash('admin123')
print("Nuevo hash:", nuevo_hash)