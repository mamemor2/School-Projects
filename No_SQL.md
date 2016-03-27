**Big Data Project with NoSQL DB**
==================================

Voir objectifs et instructions du TP dans le pdf joint.

**1/Data integration : explain how the data has been recovered from the EnerNOC website and how it has been integrated into MongoDB**

Les données ont été téléchargées manuellement à partir du site web «https://open-enernoc-data.s3.amazonaws.com/anon/all-data.tar.gz». Elles se composent de fichiers csv :
- le fichier all_sites.csv qui contient les données de consommation d'énergie des 100 sites de la société ENERNOC
- une collection de fichiers csv qui contiennent les relevés de consommation d'énergie pour chacun des 100 sites par période de 5 minutes.

La première étape à réaliser pour intégrer les données après avoir installé MongoDB est de démarrer le client via la commande « mongod » en ligne de commande et de lancer la console mongoDB via la commande « mongo » (Linux – Distribution Ubuntu 14.04). Ensuite, pour importer le contenu des fichiers csv on choisit la base de données de réception des données et on crée une ou plusieurs collections où nous stockerons les documents. 

MongoDB est une base de données orientée documents c'est à dire que les données sont stockées sous forme de documents dans des collections. Nous choisissons pour l'importation des données d'intégrer toutes les données sous forme de documents au sein d'une seule collection. Nous verrons dans la question 2 pourquoi nous avons fait ce choix.

> show dbs
<database>  0.000GB
local       0.000GB
test        0.000GB
use test
db.createCollection("ernoc")  
la collection qui recevra tous les documents s’appelle ernoc  
show collections  
ernoc

Pour importer les fichiers csv on utilise l'outil mongoimport (à utiliser en ligne de commande dans un terminal) qui comporte plusieurs arguments, la base de données de destination, la collection de réception des documents importés, le type du fichier source, l'adresse du fichier source et si la première ligne du fichier contient des titres (voir ci-dessous). mongoimport importe automatiquement les données issues du fichier csv dans la collection ernoc sous forme de documents. Une ligne du fichier csv correspond à un document. Les titres des colonnes du fichier csv sont automatiquement repris comme clés et les données des colonnes comme valeurs (les documents MongoDB sont assimilables à des dictionnaires clé-valeurs).

> mongoimport -d test -c ernoc --headerline --type csv --file "/home/reddowan/Documents/Telecom Paris/2-No SQL/all-data/meta/all_sites.csv"



En retournant dans la console on véfirie que l'import s'est bien déroulé
> db.ernoc.findOne()  
{  
	"_id" : ObjectId("56e5d298ae7cb0218436becd"),  
	"SITE_ID" : 6,  
	"INDUSTRY" : "Commercial Property",  
	"SUB_INDUSTRY" : "Shopping Center/Shopping Mall",  
	"SQ_FT" : 161532,  
	"LAT" : 34.78300117,  
	"LNG" : -106.8952497,  
	"TIME_ZONE" : "America/Denver",  
	"TZ_OFFSET" : "-06:00"  
}  
> db.ernoc.find().count()  
100  
    Les 100 lignes du fichier csv all.sites.csv sont devenus 100 documents contenant les infos générales sur les sites où l'énergie est consommée, l’import s’est bien déroulé.

Il nous faut maintenant importer les valeurs de consommation électriques des différents sites. Il nous faut donc construire une boucle d’importation. Cette boucle peut être réalisée avec n'importe quel langage driver compatible avec MongoDB. Nous choisissons Python et les librairies :
pymongo pour se connecter à la base de données MongoDB 
pandas pour lire les fichiers sources csv
json pour transformer les fichiers csv en json, qui est similaire au format des documents MongoDB (BSON)
En analysant les fichiers csv on s'aperçoit que les « documents » de consommations électriques par site qui seront importés ne contiennent aucune « clé » qui permet de retrouver leur site d’appartenance. Les jointures avec les documents qui contiennent les informations sur les sites (secteur d'activité etc.) ne seront pas possibles. Pour être capable de retrouver à quel site appartiennent les consommations il faut donc impérativement compléter les documents qui seront importés. MongoDB nous permet de le faire en ajoutant des paires clé-valeur aux documents qui seront importés. Dans ce TP nous choisissons d’ajouter systématiquement des paires clé-valeurs aux documents plutôt que de calculer des jointures car c’est, il me semble, l’esprit de MongoDB. A chaque document de consommation électrique à un instant donné nous rajoutons donc la clé d'identification du site à laquelle elle appartient, ainsi que l'industrie et la sous-industrie pour répondre aux questions suivantes de ce TP. On identifie les documents nouvellement importés à chaque itération par le fait qu'ils ne contiennent pas de clé « SITE_ID ».

> import pymongo, pandas as pd, json  
from pymongo import MongoClient  
client=MongoClient('localhost',27017)  
db=client.test  
sites=pd.read_csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/all-data/meta/all_sites.csv",usecols=["SITE_ID","INDUSTRY","SUB_INDUSTRY"])  
#on crée un dataframe qui ne contient que les colonnes qui nous intéressent. On itère ensuite sur les lignes pour mettre à jour les documents.  
for index, row in sites.iterrows():  
try :  
 db.ernoc.insert(json.loads(pd.read_csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/all-data/csv/"+str(sites[‘SITE_ID’])+".csv").to_json(orient='records')) )  
 db.ernoc.update_many({'SITE_ID':{'$exists':0}}, {'$set':{'SITE_ID':sites['SITE_ID'], 'INDUSTRY':sites['INDUSTRY'], 'SUB_INDUSTRY' :['SUB_INDUSTRY']}})  
except OSError :  
 continue

Tous les documents ont été importés et nous sommes capables d'associer à chaque valeur de consommation électrique le site où elle a été relevée, son industrie et sous-industrie.

**2/Data modeling : What data model and representation model should you use in your NoSQL database ? Why ?**

Le modèle choisi est d'avoir une seule collection (« ernoc ») qui contient des millions de documents de deux types :
- Les documents contenant les informations sur les sites de consommations d'énergie (site id, industry, sub-industry, surface, latitude, longitude, time zone et décalage horaire)
- Les documents contenant les informations sur les valeurs de consommation relevées (timestamp, date, valeur de consommation, estimation, anomalie ET auquel a été ajouté à l'étape précédente la clé du site auquel cette information de consommation appartient, l’industrie et sous industrie)

La force de MongoDB est de nous permettre de gérer ces documents qui obéissent à des schémas différents dans une même collection. MongoDB nous permet également de lancer des requêtes sur tous les éléments de ces document qui sont stockés sous la forme de dictionnaires « clé-valeur » pour obtenir l'information recherchée. Pour ceci il faut par contre que le maximum d’informations liées à un item soient disponibles dans un seul document pour ne pas avoir à effectuer de jointure. MongoDB propose peu d’outils pour les jointures ($lookup) et cela se fait au détriment de la vitesse d’exécution et capacité de passage à l’échelle. Nous allons voir comment utiliser des requêtes pour retrouver des valeurs au sein de documents dans les questions suivantes.

**3/Query : define and run the following queries with your chosen NoSQL DB
Try some simple queries (5 simples queries) : SELECT queries to explore your data, ORDER BY to sort data, etc.**

Même avec un grand nombre de documents MongoDB est capable de retourner le nombre de documents dans la collection en un temps très court :

> db.ernoc.find().count()  
10531388

Pour illustrer les query dont est capable MongoDB, dans l’exemple ci-dessous on recherche tous les documents dont le numéro du site est 6 et dont l’industrie est Light Industrial.

> db.ernoc.find({'SITE_ID':6,'INDUSTRY':”Light Industrial”})

On peut ensuite ne vouloir que quelques types de clés pour cette recherche et pour ça on utilise les projections, celles-ci nous permettent de retourner uniquement les clés qui nous intéressent dans les documents recherchés :

> db.ernoc.find({'SITE_ID':6,'INDUSTRY':”Light Industrial”},{ ‘ _id‘ :0,‘SUB_INDUSTRY’:1})

**Calculate the sum LD for the 100 sites (timestamp interval:5 minutes)**

Pour calculer la somme totale de consommation électrique sur tous les sites on utilise la commande $aggregate de MongoDB. Celle-ci nous permet de regrouper les données par différentes étapes de manipulation et obtenir une vue sur les données comme cela nous est demandé dans cette question. Ici, nous regroupons toutes les valeurs de consommation électrique par l’étape $group et nous les sommons les unes aux autres via $sum, enfin nous vérifions que toutes les données ont été prises en compte via ‘count’. 

> db.ernoc.aggregate([{$group:{_id : null, totalValue: {$sum: "$value"}, count: {$sum: 1}}}])  
{ "_id" : null, "totalValue" : 524789948.5085425, "count" : 10531388 }

L’opération nous renvoi un _id, ici fixé à null car nous ne souhaitons qu’une valeur ( le _id permet de catégoriser les aggrégations selon un filtre défini). la somme totale des valeurs, et le compte total des valeurs sommées.

**Calculate the average LD by sector of activity (timestamp interval:5 minutes)**

Cette fois on nous demande de calculer une moyenne des consommations électriques et non plus une somme totale et de la calculer par type d’industrie. On utilise donc le filtre _id pour grouper les documents par industrie et on calcule la moyenne des consommations par la commande $avg sur les valeurs.

> db.ernoc.aggregate([{$group:{_id:"$INDUSTRY",avgLD:{$avg:"$value"}}}])  
{ "_id" : "Light Industrial", "avgLD" : 80.53605411732629 }  
{ "_id" : "Education", "avgLD" : 10.958664622454505 }  
{ "_id" : "Food Sales & Storage", "avgLD" : 18.18904625241797 }  
{ "_id" : "Commercial Property", "avgLD" : 89.74327534139022 }  

**Calculate the total LD for the 100 sites (timestamp interval : a week)**

Pour cette question nous devons être capables de calculer pour tous les sites la consommation électrique totale comme plus-haut mais de retourner un résultat par semaine, or nous n’avons pas d’indication de semaine dans nos documents mais nous avons une indication de « timestamp » qui correspond aux nombres de secondes écoulées depuis le 1er janvier 1970. J’ai donc choisi de convertir le « timestamp » en nombre de semaines écoulées depuis le 1er janvier 1970 et de regrouper tous les documents via ce numéro de semaine. Ensuite toutes les valeurs de consommation électriques dans une même semaine sont sommées.

Consommation totale (tous sites compris) par semaine

> #Numéro de la semaine (depuis le 1er janvier 1970, UTC référence), on divise les secondes par 60 pour les minutes, par 60 pour les heures, par 24 pour les jours et par 7 pour avoir des semaines. La commande $trunc nous permet de tronquer le résultat obtenu au numéro de la semaine en cours.  
db.ernoc.aggregate( [  {   $group:    {_id:{$trunc:{$divide: ["$timestamp",60*60*24*7]}}, weekLD:{$sum:"$value"}}  } ] )  
{ "_id" : 2243, "weekLD" : 5976001.066800636 }
{ "_id" : 2242, "weekLD" : 7907839.671499391 }
{ "_id" : 2241, "weekLD" : 9816839.844898174 }
{ "_id" : 2240, "weekLD" : 9641062.37169756 }
{ "_id" : 2239, "weekLD" : 9691423.54439863 }
{ "_id" : 2238, "weekLD" : 8064684.433099514 }
{ "_id" : 2237, "weekLD" : 9712192.997099284 }
{ "_id" : 2236, "weekLD" : 9974266.817198629 }
{ "_id" : 2211, "weekLD" : 10180870.929498775 }
{ "_id" : 2209, "weekLD" : 10101853.333298672 }
{ "_id" : 2208, "weekLD" : 9793765.69729922 }
{ "_id" : 2207, "weekLD" : 9584214.178398728 }
{ "_id" : 2206, "weekLD" : 9599883.920698717 }
{ "_id" : 2205, "weekLD" : 9131903.196998985 }
{ "_id" : 2204, "weekLD" : 9735211.794798259 }
{ "_id" : 2203, "weekLD" : 9935733.169098658 }
{ "_id" : 2202, "weekLD" : 10031750.660298806 }
{ "_id" : 2201, "weekLD" : 9765488.16829842 }
{ "_id" : 2200, "weekLD" : 9857675.484898778 }
{ "_id" : 2210, "weekLD" : 10018419.93419861 }
Type "it" for more
> it
{ "_id" : null, "weekLD" : 0 }
{ "_id" : 2235, "weekLD" : 9767846.190899326 }
{ "_id" : 2199, "weekLD" : 9944587.61069839 }
{ "_id" : 2191, "weekLD" : 4463277.411000276 }
{ "_id" : 2192, "weekLD" : 9632667.774898428 }
{ "_id" : 2193, "weekLD" : 10035110.168799227 }
{ "_id" : 2194, "weekLD" : 10298699.338599017 }
{ "_id" : 2195, "weekLD" : 10088270.066899713 }
{ "_id" : 2196, "weekLD" : 10084686.982298974 }
{ "_id" : 2197, "weekLD" : 10119827.75929823 }
{ "_id" : 2198, "weekLD" : 9805957.563998047 }
{ "_id" : 2212, "weekLD" : 9568592.526299547 }
{ "_id" : 2213, "weekLD" : 9906730.537099324 }
{ "_id" : 2214, "weekLD" : 10384721.01769889 }
{ "_id" : 2215, "weekLD" : 10687267.250197703 }
{ "_id" : 2216, "weekLD" : 10555812.8241982 }
{ "_id" : 2217, "weekLD" : 10432175.1306991 }
{ "_id" : 2218, "weekLD" : 10684507.80759884 }
{ "_id" : 2219, "weekLD" : 11053164.619299466 }
{ "_id" : 2220, "weekLD" : 11048395.977398857 }
Type "it" for more
> it
{ "_id" : 2221, "weekLD" : 11485376.152998114 }
{ "_id" : 2222, "weekLD" : 11456714.592398304 }
{ "_id" : 2223, "weekLD" : 11162752.561198564 }
{ "_id" : 2224, "weekLD" : 10726216.897499038 }
{ "_id" : 2225, "weekLD" : 11174257.106698163 }
{ "_id" : 2226, "weekLD" : 10466310.571998324 }
{ "_id" : 2227, "weekLD" : 11284604.530798256 }
{ "_id" : 2228, "weekLD" : 10695867.235996604 }
{ "_id" : 2229, "weekLD" : 10037147.322898932 }
{ "_id" : 2230, "weekLD" : 10180178.714499045 }
{ "_id" : 2231, "weekLD" : 9787477.886198461 }
{ "_id" : 2232, "weekLD" : 9817773.177499736 }
{ "_id" : 2233, "weekLD" : 9792375.065899603 }
{ "_id" : 2234, "weekLD" : 9639516.918500055 }
>

**Calculate the average LD by sector of activity (timestamp interval : a week)**

Idem que précédemment, sauf que l’on souhaite grouper les données par numéro de semaine et par secteur d’activité. On spécifie donc _id pour être composé de ces deux éléments.

> db.ernoc.aggregate( [  {   $group:    {_id:{INDUSTRY:"$INDUSTRY",weeknumber:{$trunc:{$divide: ["$timestamp",60*60*24*7]}}}, weekLD:{$avg:"$value"}}  } ] )  
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2243 }, "weekLD" : 66.85981015960297 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2242 }, "weekLD" : 62.69296444443531 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2241 }, "weekLD" : 78.50031697420557 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2240 }, "weekLD" : 78.73794018650732 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2239 }, "weekLD" : 79.62140102777542 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2238 }, "weekLD" : 64.26658427453634 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2237 }, "weekLD" : 85.21311023773963 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2236 }, "weekLD" : 83.80596260044915 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2235 }, "weekLD" : 82.78379995634961 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2234 }, "weekLD" : 80.83272342063626 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2233 }, "weekLD" : 81.408021708328 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2232 }, "weekLD" : 81.43626303545048 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2231 }, "weekLD" : 80.05741872891167 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2230 }, "weekLD" : 82.94395072023511 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2229 }, "weekLD" : 82.12315113399272 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2228 }, "weekLD" : 87.07964033730183 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2227 }, "weekLD" : 90.35490802214842 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2226 }, "weekLD" : 82.74216714880659 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2220 }, "weekLD" : 87.12954689285654 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2221 }, "weekLD" : 92.09272887301857 }
Type "it" for more
> it
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2222 }, "weekLD" : 90.61815033136102 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2243 }, "weekLD" : 74.91566007217672 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2223 }, "weekLD" : 86.84227472420787 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2242 }, "weekLD" : 69.79085903571743 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2224 }, "weekLD" : 85.88437336309225 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2241 }, "weekLD" : 89.00470548809157 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2225 }, "weekLD" : 88.18326915613693 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2195 }, "weekLD" : 11.089821718254955 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2240 }, "weekLD" : 85.01607146428191 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2194 }, "weekLD" : 11.336695839286124 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2239 }, "weekLD" : 84.65255705469974 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2193 }, "weekLD" : 10.81377335714319 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2192 }, "weekLD" : 11.072147680556524 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2191 }, "weekLD" : 9.534551169581162 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2212 }, "weekLD" : 11.632811750002253 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2207 }, "weekLD" : 85.25118185713606 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2195 }, "weekLD" : 80.08846904365015 }
{ "_id" : { "INDUSTRY" : "Education", "weeknumber" : 2211 }, "weekLD" : 12.497078487519238 }
{ "_id" : { "INDUSTRY" : "Commercial Property", "weeknumber" : 2206 }, "weekLD" : 85.4549754662627 }
{ "_id" : { "INDUSTRY" : "Light Industrial", "weeknumber" : 2196 }, "weekLD" : 80.89154656746011 }
Type "it" for more
>


**4/Bonus (to go further : cross reference temperatures and energy consumption) : retrieve the weather data (temperatures in US in 2012) + explore the temperature dependence by sector of activity (correlation between electrical consumption and temperature).**

Pour commencer nous téléchargeons les données de températures aux US en 2012 au lien suivant :
http://cdo.ncdc.noaa.gov/qclcd_ascii/

En suivant ce lien nous récupérons les fichiers suivants :

2012<01-12>dayly.txt : données météorologiques aggrégées par jour ;  
2012<01-12>hourly.txt : données météorologiques aggrégées par heure ;  
2012<01-12>monthly.txt : données météorologiques aggrégées par mois ;  
2012<01-12>precip.txt : donnés pluviométriques par jour  
2012<01-12>remarks.txt : timestamp de relevé par station  
2012<01-12>station.txt : métadonnées sur les stations météo en particulier leur géolocalisation.  

Ces fichiers sont déjà au format csv (comma seperated values), il suffit donc de changer l'extension du txt pour pouvoir l’importer dans MongoDB comme fait précédemment. SAUF pour le fichier stations ou le séparateur n’est pas une virgule mais le caractère : « | » ,pour rendre le fichier compatible csv on remplace le caractère par une virgule en utilisant ctrl+H (logiciel gedit sur Ubuntu).

Avant d’importer les données il faut une collection de réception des documents. On crée une collection du nom de weather et on utilise l’outil mongoimport comme précédemment pour importer les documents.

> db.createCollection("weather")

Puis on importe les données de température par l'outil mongoimport comme précédemment.

> mongoimport -d test -c weather --headerline --type csv --file "/home/reddowan/Documents/Telecom Paris/2-No SQL/weather/201201daily.csv"  
mongoimport -d test -c weather --headerline --type csv --file "/home/reddowan/Documents/Telecom Paris/2-No SQL/weather/201201station.csv"  


Les documents importés dans MongoDB qui contiennent les données de témpératures ne contiennent pas les informations de Latitude et Longitude. Comme précédemment et pour les mêmes raisons (ne pas avoir à faire de jointure) nous allons les ajouter aux documents via une boucle en utilisant Python.

> //Dans Python :
import pymongo, pandas as pd, json  
from pymongo import MongoClient  
client=MongoClient('localhost',27017)  
db=client.test  

Liste des WBAN et Latitude Longitude pour itération de mise à jour. AU préalable une mise à jour du fichier 201201station au format UTF-8 a été nécessaire pour éxécuter la fonction read de pandas.
> WBANs=pd.read_csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/weather/201201station2.csv",usecols=["WBAN","Latitude","Longitude"])  
for index, row in WBANs.iterrows():  
  db.weather.update_many({'WBAN':row['WBAN']}, {'$set':{'Latitude':row['Latitude'],'Longitude':row['Longitude']}})  

Tous les documents avec les données de temperature ont été mis à jour avec l'information Latitude et Longitude. Il nous faut maintenant faire la même chose avec notre collection ernoc qui contient les informations de consommation électrique.
Liste des sites pour itération de mise à jour
Attention le champ SITE_ID est au format string, choix que nous avons fait au préalable.

> sites=pd.read_csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/all-data/meta/all_sites.csv",usecols=["SITE_ID","LAT","LNG"])  
for index, row in sites.iterrows():  
  db.ernoc.update_many({'SITE_ID':str(int(row['SITE_ID']))},{'$set':{'LAT':row['LAT'],'LNG':row['LNG']}})

 
Maintenant nous voulons créer des vues réduites sur les documents afin de comparer consommation électrique et température par site géographique. Nous créons pour cela deux nouvelles collections qui contiendront 1-les consommations électriques par jour et par site, et 2-les températures par jour et par site.  
> db.createCollection("ernocanalysis")

On utilise une troncature sur la chaîne de caractère dttm_utc pour avoir un groupement par jour de la consommation électrique
> db.ernoc.aggregate([{$group:{_id:{SITE_ID:"$SITE_ID",LAT:"$LAT",LNG:"$LNG",day:{$substr:["$dttm_utc",0,10]}},dayvalue:{$sum:"$value"}}},{$out:"ernocanalysis"}])  
> db.ernocanalysis.findOne()  
{  
	"_id" : {  
		"SITE_ID" : "887",  
		"LAT" : 38.83195039,  
		"LNG" : -75.82502245,  
		"day" : "2013-01-01"  
	},  
	"dayvalue" : 126.04  
}   

On vérifie le nombre d'éléments dans cette nouvelle collection.
> db.ernocanalysis.find().count()   
36773  

On réalise la même chose pour les informations de temperature.
> db.weather.aggregate([{$group:{_id:{WBAN:"$WBAN",LAT:"$Latitude",LNG:"$Longitude",day:"$YearMonthDay",Tmin:"$Tmin",Tmax:"$Tmax",Tavg:"$Tavg"}}},{$out:"weatheranalysis"}])  

On vérifie l'importation
> db.weatheranalysis.find().count()  
40149 

On exporte les collections dans des fichiers au format csv pour pouvoir analyser les correlations dans le logiciel R

> mongoexport --db test --collection weathercanalysis --type=csv --fields _id.WBAN,_id.LAT,_id.LNG,_id.day,_id.Tmin,_id.Tmax,_id.Tavg --out weatheranalysis.csv   
mongoexport --db test --collection ernocanalysis --type=csv --fields _id.SITE_ID,_id.LAT,_id.LNG,_id.day,dayvalue --out ernocanalysis.csv  

Dans R on importe les fichiers au format csv via les commandes ci-dessous

> weather=read.csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/weatheranalysis.csv",header=TRUE)  
ernoc=read.csv("/home/reddowan/Documents/Telecom Paris/2-No SQL/ernocanalysis.csv",header=TRUE)  

Pour analyser les corrélations nous avons beaucoup d'outils. Le but de ce TP n'étant pas d'écrire des lois de corrélations ou prédictions. Nous allons simplement démontrer que plus la latitude est élevée, plus la température diminue (logique!) et plus la consommation électrique croît.

Pour représenter ces données en 2 dimensions on extrait du dataframe de temperature « weather » les températures constatées le 1er janvier 2012 en fonction de la latitude. On trace le résultat via la fonction plot de R

> weatherss=subset(weather, weather$X_id.day=20120101)
plot.default(weatherss$X_id.LAT,weatherss$X_id.Tavg)  




On remarque visuellement que pour notre subset du 1er janvier 2012, la température diminue avec la latitude ce qui confirme notre intuition.

On réalise la même opération pour les consommations électriques, sélection des données au 1er janvier 2012 et on trace la courbe consommations électriques en fonction de la latitude.

> ernocss=subset(ernoc,ernoc$X_id.day=="2012-01-01")  
plot.default(ernocss$X_id.LAT,ernocss$dayvalue)



Idem, on observe visuellement que la consommation électrique augmente avec la température. 

Par ces quelques opérations de visualisation des données nous avons pu voir d'autres fonctions de MongoDB et réaliser un début d'analyse dans R.
