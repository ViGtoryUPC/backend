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
        grau (683 - GRAU EN ENGINYERIA ELECTRÒNICA INDUSTRIAL I AUTOMÀTICA,
              682 - GRAU EN ENGINYERIA MECÀNICA,
              681 - GRAU EN ENGINYERIA ELÈCTRICA,
              666 - GRAU EN ENGINYERIA DE DISSENY INDUSTRIAL I DESENVOLUPAMENT DEL PRODUCTE,
              1339 - GRAU EN ENGINYERIA INFORMÀTICA)
              PASAR NOMES EL CODI CORRESPONENT AL GRAU!!!!

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

    http://localhost:4000/user/afegirSegonCorreu
    POST
      Body:
        email

    http://localhost:4000/user/modificarCorreu
    POST
      Body:
        email
    
    http://localhost:4000/grau/getAllGraus
    GET
      Body:
        -
    
    http://localhost:4000/assignatura/getAssignatures
    GET
      Body:
        -
    
    http://localhost:4000/aportacio/newAportacio
    POST
      Body:
        titol
        body
        sigles_ud (Les sigles rebudes amb el metode getAssignatures)
    
    http://localhost:4000/aportacio/getAllAportacionsForAssignatura
    GET
      Body:
        sigles_ud
        pagina (pagina a mostrar de la paginacio)
        limit (nombre d'aportacions per pàgina)
    
    http://localhost:4000/aportacio/voteAportacio
    POST
       body:
         aportacioId
         vote (1 o -1)
    
    http://localhost:4000/aportacio/getAportacio
    GET
      body:
        _id
        
    http://localhost:4000/comentari/newComentari
    POST:
      body:
        idAportacio
        body
        idParent (buit si es un comentari pare, altrament id del comentari pare)
    
    http://localhost:4000/comentari/getComentaris
    GET
      body:
        idAportacio
     
    http://localhost:4000/comentari/voteComentari
    POST
      body:
        comentariId
        aportacioId
        vote (1 o -1)
        
    http://localhost:4000/comentari/deleteComentari
    POST
        body:
            aportacioId
   
    http://localhost:4000/aportacio/deleteAportacio
    POST
        body:
            comentariId
    
    
        
      
    
      
      
    
    
