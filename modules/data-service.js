const siteData = require("../data/NHSiteData");
const provinceAndTerritoryData = require("../data/provinceAndTerritoryData");

let sites = [];

function initialize(){
     return new Promise((resolve, reject)=>{
        sites = siteData.map(site =>{
            const provinceObj = provinceAndTerritoryData.find((prov) => prov.code === site.provinceOrTerritoryCode);
            return {...site, provinceOrTerritoryObj: provinceObj};
        })
        resolve();
     });
}

function getAllSites(){
    return new Promise((resolve, reject)=>{
        if (sites.length > 0){
            resolve(sites);
        }
    });
} 

function getSiteById(id){
    return new Promise((resolve, reject)=> {
        let site = sites.find(site => site.siteId === id);
        if (site){
            resolve(site);
        } else{
            reject('Unable to find requested site');
        }
    });
}

function getSitesByProvinceOrTerritoryName(name){
    return new Promise((resolve, reject)=>{
        const filteredProvinces = sites.filter(site => site.provinceOrTerritoryObj.name.toLowerCase().includes(name.toLowerCase()));
        if (filteredProvinces.length > 0){
            resolve(filteredProvinces);
        } else{
            reject('Unable to find requested site');
        }
    });
} 

function getSitesByRegion(region) {
    
    return new Promise((resolve, reject) => {
        const filteredRegion = sites.filter(site => site.provinceOrTerritoryObj.region.toLowerCase().includes(region.toLowerCase()));
        if (filteredRegion){
            resolve(filteredRegion);
        } else{
            reject('Unable to find requested site');
        }
    });
}

module.exports = { initialize, getAllSites, getSiteById, getSitesByProvinceOrTerritoryName, getSitesByRegion }