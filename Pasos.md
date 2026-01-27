# PASO A PASO

## BACKEND



### Instalar nest como framework de backend


**PD: Se pueden saltar las intalaciones clonando el repo y dentro de backend hacer pnpm install **


```
$ pnpm i -g @nestjs/cli  → Instalar nest globalmente
$ nest new project-name → Crear un nuevo proyecto (Ahi colocar ell nombre del backend)
```

### Instalar prisma como ORM dentro de backend 

```
pnpm install prisma @types/node @types/pg --save-dev
pnpm install @prisma/client @prisma/adapter-pg pg dotenv

```

## Inicializar prisma

```
npx prisma init --datasource-provider postgresql --output ../generated/prisma

```

## Conectar BD a prisma

Dentro del archivo .env generado por prisma 

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

## Si se tienen modelos ya creados en la bd 

```
npx prisma db pull
```



ESTE ES EL RESUMEN DE LAS INTALACIONES MAS IMPORTANTES (Framework backend y ORM)  el resto de instalaciones hacerlas con pnpm install 

Los siguientes pasos se haran basandose en las documentaciones de cada uno 

nest = https://docs.nestjs.com/
prisma = https://www.prisma.io/docs/getting-started/prisma-orm/add-to-existing-project/postgresql


Los siguientes pasos fueron 


1. Crear el servicio de PRISMA src/prisma/prisma.service.ts
2. Crear modulo de usuarios src/users/dto/create-user.dto.ts 
 src/users/dto/update-user.dto.ts
 src/users/dto/user-response.dto.ts
3. Crear servicio de usuarios src/users/users.service.ts
4.  Crear controlador de usuarios src/users/users.controller.ts
5. Finalizar el modulo de usuarios en src/users/users.module.ts
6. Hacer lo mismo para auth en 
src/auth/dto/login.dto.ts
src/auth/dto/register.dto.ts
src/auth/auth.service.ts
src/auth/strategy/jwt.strategy.ts
src/auth/guards/jwt-auth.guard.ts
src/auth/auth.controller.ts
src/auth/auth.module.ts

7. Crear el decorador para obtener el usuario 
src/common/decorators/get-user.decorator.ts

8. Configurar variables de entorno jwt en .env

9. Acualizar app.module.ts

## CORRER EL SERVER Y VERIFICAR ENDPOINTS


