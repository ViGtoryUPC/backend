# Backend

Iniciar servidor: $ npm run start

///////////////////
RUTES SENSE JWT:
///////////////////
http://localhost:4000/user/signUp
POST
  Body:
    username
    password
    confirmPassword
    email
    degree

http://localhost:4000/user/signIn
POST
  Body:
    username:
    password:
    
    
    
///////////////////
RUTES AMB JWT:
  Headers:
    authorization
///////////////////
http://localhost:4000/user/modificarGrau
POST
  Body:
    grau

http://localhost:4000/user/modificarContrasenya
POST
  Body:
    password
    newPassword
    confirmPassword
    
http://localhost:4000/user/getInfoUsuari
GET
  Body:
    -
    
http://localhost:4000/afegirSegonCorreu
POST
  Body:
    email

http://localhost:4000/modificarCorreu
POST
  Body:
    email
