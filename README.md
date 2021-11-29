# Backend

Iniciar servidor: $ npm run start

///////////////////
RUTES SENSE JWT:
///////////////////
http://localhost:4000/user/signUp
POST
  Params: 
    username
    password
    confirmPassword
    email
    degree

http://localhost:4000/user/signIn
POST
  Params:
    username:
    password:
    
    
    
///////////////////
RUTES AMB JWT:
  Headers:
    authorization
///////////////////
http://localhost:4000/user/modificarGrau
POST
  Params:
    grau

http://localhost:4000/user/modificarContrasenya
POST
  Params:
    password
    newPassword
    confirmPassword
    
http://localhost:4000/user/getInfoUsuari
GET
  Params:
    -
    
http://localhost:4000/afegirSegonCorreu
POST
  Params:
    email

http://localhost:4000/modificarCorreu
POST
  Params:
    email
