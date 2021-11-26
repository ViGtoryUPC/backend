import { Schema, model } from "mongoose";

const grauSchema = new Schema(
	{
		name: { type: String, required: true , unique: true, dropDubs: true},
	},
);

grauSchema.methods.insertGraus = async function () {
    this.insertMany([
        { name: 'Grau en Àmbit Industrial'},
        { name: 'Grau en Enginyeria Mecànica'},
        { name: 'Grau en Enginyeria Elèctrica'},
        { name: 'Grau en Enginyeria Electrònica Industrial i Automàtica'},
        { name: 'Grau en Enginyeria Informàtica'},
        { name: 'Grau en Enginyeria de Disseny Industrial i Desenvolupament del Producte'}
    ]).then(function(){
        console.log("Graus inserits")
    }).catch(function(error: any){
        console.log(error)
    });
};

const grau = model("grau", grauSchema);

export default grau;