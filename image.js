const ENDPOINT="https://pokeapi.co/api/v2/pokemon/"
// at 1025 pokemon id jumps to 10,000
// 1-1025 is all the pokemon without 
// special forms like alola and mega
// https://pokeapi.co/api/v2/pokemon/?offset=1020&limit=400
const MAX_POKEMON=(await axios.get('https://pokeapi.co/api/v2/pokemon/')).data.count 
const ORIGINAL_CARD_WIDTH=480
const ORIGINAL_CARD_HEIGHT=650
const CARD_WIDTH=250
const CARD_HEIGHT=350
const MAX_MAINLINE_POKEMON = Number((await axios.get('https://pokeapi.co/api/v2/pokemon-species/')).data.count);
let arr = (await axios.get(`https://pokeapi.co/api/v2/pokemon/?offset=${MAX_MAINLINE_POKEMON}&limit=1`)).data.results[0].url.split("/"); 
const SPECIAL_POKEMON_START = Number(arr[arr.length-2])
let CORS_PROXY = "https://cors-anywhere.herokuapp.com/"
export const GENERATIONS = {
  "Scarlet & Violet":"scarletAndViolet",
  "Sword & Shield":"swordAndShield",
  "Sun & Moon":"sunAndMoon",
  "X & Y/ Black and White":"xAndYBlackAndWhite"
}
const OVERRIDE_TYPES = {
  "electric": "lightning",
  "normal": "colorless"
}
const TYPE_BASE = "https://pokecardmaker.net/assets/icons/types/"
//https://card-pokemon.com/
import * as Magick from 'https://knicknic.github.io/wasm-imagemagick/magickApi.js';
export async function addRules() {
  for (i of Array(6).keys()) {
    let id = getId()
    let pokemon =  await getPokemon(id)
    await addRule(i,pokemon) 
  }
}
function getId() {
  let id1 = randomNumber(1,MAX_MAINLINE_POKEMON)
  let id2 = randomNumber(SPECIAL_POKEMON_START,SPECIAL_POKEMON_START+(MAX_POKEMON-MAX_MAINLINE_POKEMON))
  let condition = Boolean(Math.round(Math.random()))
  let id = null
  if(condition) {
    id=id1
  }else {
    id=id2
  }
  return id 
}
function randomNumber(min,max) {
  return Math.floor(Math.random() * (max-min+1) + min)
}
async function  getPokemon(id) {
  return (await axios.get(`${ENDPOINT}${id}`)).data
}
async function addRule(index,pokemon) {
  let sprite = await fetch(pokemon.sprites.other.home.front_default) 
  let base = await fetchCard(pokemon)
  let img = await createImage(base,sprite,pokemon.name)
  let imgURL = createImageURL(img)
  let sheet = document.styleSheets[1]
  let rule = `.image-${index+ 1} .card-up {
  background-image: url(${imgURL});
  `
  sheet.insertRule(rule)
}
async function fetchCard(pokemon) {
  let gen = GENERATIONS[document.querySelector("#selected-gen").innerText.trim()]
  let GEN_TYPES = `${TYPE_BASE}${gen}`
  for (let type of pokemon.types) {
    console.log(`${pokemon.name} type: ${type.type.name}`)
    try {
      await fetch(`${GEN_TYPES}/${type.type.name}.png`)
      let cardURL = `https://pokecardmaker.net/_next/image?url=%2Fassets%2Fcards%2FbaseSets%2F${gen}%2Fsupertypes%2Fpokemon%2Ftypes%2F${type.type.name}%2Fsubtypes%2Fbasic.png&w=480&q=100`
      return await fetch(cardURL)
    } catch (error) {
      try {
        let alternate = OVERRIDE_TYPES[type.type.name]
        let cardURL =  `https://pokecardmaker.net/_next/image?url=%2Fassets%2Fcards%2FbaseSets%2F${gen}%2Fsupertypes%2Fpokemon%2Ftypes%2F${alternate}%2Fsubtypes%2Fbasic.png&w=480&q=100`
        return await fetch(cardURL)
      } catch (error) {
        continue
      }
    }
  }
  return fetch(`https://pokecardmaker.net/_next/image?url=%2Fassets%2Fcards%2FbaseSets%2F${gen}%2Fsupertypes%2Fpokemon%2Ftypes%2Fcolorless%2Fsubtypes%2Fbasic.png&w=480&q=100`)
}
async function createImage(baseResponse, spriteResponse, name) {
  const baseContent = new Uint8Array(await baseResponse.arrayBuffer());
  const spriteContent = new Uint8Array(await spriteResponse.arrayBuffer());

  let base = {name:"base.png",content:baseContent}
  let sprite = {name:"sprite.png",content:spriteContent}
  
  let spriteWidth = ORIGINAL_CARD_WIDTH/3
  let spriteHeight = ORIGINAL_CARD_WIDTH/3

  let command = ["convert", "base.png", "sprite.png",  "-gravity", "center", "-geometry", `${spriteWidth}x${spriteHeight}+0-${spriteHeight}`, "-composite" ,"-resize", `${CARD_WIDTH}x${CARD_HEIGHT}`, "card.png"]
  let card = (await Magick.Call([base,sprite],command))[0]
  card.content = card.buffer
  
  let textSize = CARD_HEIGHT/10 
  command = ["convert", "card.png", "-gravity", "North", "-pointsize",`${textSize}`,"-annotate","+0+0",name,"output.png"]
  let output = (await Magick.Call([card], command))[0]
  return output
}
function createImageURL(image) {
  return  URL.createObjectURL(image.blob)
}
export function removeRules() {
  let sheet = document.styleSheets[1]
  let ruleArr =  Array.from(sheet.cssRules)
  for ([index,rule] of ruleArr.entries()){
    if(/image-[1-6] \.card-up/.test(rule.selectorText)) {
      blob = document.styleSheets[1].cssRules[1].style.backgroundImage
      URL.revokeObjectURL(blob.match('"blob:(.*)"')[1])
      sheet.deleteRule(index)
    } 
  }
}
await addRules()
