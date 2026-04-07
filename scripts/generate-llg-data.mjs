import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "src", "data");

const provinces = JSON.parse(readFileSync(join(dataDir, "provinces.json"), "utf-8"));
const electorates = JSON.parse(readFileSync(join(dataDir, "electorates.json"), "utf-8"));

// Known LLG names by electorate (representative sample — real data would come from PNG EC)
const llgNames = {
  "north-fly": ["Kiunga Urban", "Ningerum", "Olsobip", "Star Mountains"],
  "middle-fly": ["Balimo Urban", "Bamu", "Gogodala", "Suki-Fly Delta"],
  "south-fly": ["Daru Urban", "Kiwai", "Oriomo", "Morehead"],
  "delta-fly": ["Wawoi Falls", "Bamu South", "Lake Murray"],
  "kerema": ["Kerema Urban", "Kotidanga", "Ihu", "East Kerema"],
  "kikori": ["Kikori", "Baimuru", "Kaintiba"],
  "abau": ["Abau", "Amazon Bay", "Cloudy Bay"],
  "rigo": ["Rigo Central", "Rigo Coastal", "Kwikila"],
  "kairuku-hiri": ["Kairuku", "Hiri", "Bereina Urban", "Mekeo-Kuni"],
  "goilala": ["Tapini", "Guari", "Woitape"],
  "moresby-south": ["Boroko", "Konedobu-Ela Beach", "Badili", "Sabama"],
  "moresby-north-west": ["Morata", "Gerehu", "Waigani", "Tokarara", "Hohola"],
  "moresby-north-east": ["Gordons", "Erima", "Saraga", "Six Mile"],
  "alotau": ["Alotau Urban", "Weraura", "Suau", "Huhu"],
  "kiriwina-goodenough": ["Kiriwina", "Goodenough Island", "Losuia"],
  "samarai-murua": ["Samarai", "Murua", "Misima", "Woodlark"],
  "esa-ala": ["Esa'ala", "Dobu", "Duau"],
  "ijivitari": ["Popondetta Urban", "Kokoda", "Oro Bay"],
  "sohe": ["Saiho", "Ioma", "Tufi"],
  "ialibu-pangia": ["Ialibu Urban", "Pangia", "Kewabi", "Erave South"],
  "imbonggu": ["Imbonggu Central", "Imbonggu North", "Imbonggu South", "Ialibu Rural"],
  "kagua-erave": ["Kagua", "Erave", "Kuare", "Sumi"],
  "nipa-kutubu": ["Nipa", "Kutubu", "Poroma", "Margarima South"],
  "mendi": ["Mendi Urban", "Upper Mendi", "Lower Mendi"],
  "tari-pori": ["Tari Urban", "Tari Rural", "Pori", "Tagali", "Hayapuga"],
  "koroba-kopiago": ["Koroba", "Kopiago", "Haiuwi", "Paiela"],
  "komo-margarima": ["Komo", "Margarima", "North Komo"],
  "wapenamanda": ["Wapenamanda Urban", "Tsak-Wapenamanda", "Sau-Yambitanget", "Laiagam East"],
  "kompiam-ambum": ["Kompiam", "Ambum", "Sau Valley", "Mambisanda"],
  "wabag": ["Wabag Urban", "Laiagam", "Birip-Mulitaka", "Ambum South"],
  "lagaip-porgera": ["Lagaip", "Porgera", "Paiam Urban", "Paiela South"],
  "kandep": ["Kandep", "Marient", "Wage", "Kombal"],
  "hagen": ["Mt Hagen Urban", "Hagen Central", "Mul", "Dei South", "Togoba"],
  "dei": ["Dei", "Kotna", "Muglamp", "Nebilyer North"],
  "mul-baiyer": ["Mul", "Baiyer", "Lumusa", "Alkena"],
  "tambul-nebilyer": ["Tambul", "Nebilyer", "Ka", "Alkena South"],
  "north-wahgi": ["Minj Urban", "North Wahgi", "Nondugl", "Kudjip"],
  "anglimp-south-wahgi": ["Anglimp", "South Wahgi", "Banz Urban", "Kugilka"],
  "jimi": ["Jimi", "Upper Jimi", "Tabibuga"],
  "kundiawa-gembogl": ["Kundiawa Urban", "Gembogl", "Sinasina East", "Dom"],
  "chuave": ["Chuave", "Elimbari", "Nomane North", "Siane"],
  "sinasina-yonggamugl": ["Sinasina", "Yonggamugl", "Gunangi", "Tabare"],
  "gumine": ["Gumine", "Digine", "Golin", "Salt-Nomane"],
  "kerowagi": ["Kerowagi", "Gena-Waugla", "Kunabau", "Mitnande"],
  "karimui-nomane": ["Karimui", "Nomane", "Daribi"],
  "goroka": ["Goroka Urban", "Gahuku", "Upper Asaro", "Watabung"],
  "daulo": ["Daulo", "Asaro-Watabung", "Kamaliki"],
  "henganofi": ["Henganofi", "Kafe-Dunantina", "Bena-Bena South"],
  "kainantu": ["Kainantu Urban", "Agarabi", "Obura South", "Gadsup"],
  "lufa": ["Lufa", "Unavi", "Labogai"],
  "obura-wonenara": ["Obura", "Wonenara", "Okapa South"],
  "okapa": ["Okapa", "Okapa South", "Fore"],
  "unggai-bena": ["Unggai", "Bena", "Asaro Valley"],
  "lae": ["Lae Urban", "Ahi", "Huon", "Butibam", "Taraka"],
  "huon-gulf": ["Huon Gulf", "Salamaua", "Wampar", "Lababia"],
  "bulolo": ["Bulolo Urban", "Wau", "Mumeng", "Watut"],
  "finschhafen": ["Finschhafen Urban", "Hube", "Kotte", "Komba"],
  "kabwum": ["Kabwum", "Selepet", "Timbe", "Komba North"],
  "markham": ["Markham", "Umi-Atzera", "Wampar Plains", "Leron"],
  "menyamya": ["Menyamya", "Kapao", "Aseki"],
  "nawae": ["Nawae", "Labuta", "Erap-Wantoat"],
  "tewai-siassi": ["Tewai", "Siassi", "Umboi Island"],
  "madang": ["Madang Urban", "North Coast", "Ambenob", "Transgogol", "Sumgilbar"],
  "bogia": ["Bogia", "Manam", "Tangu-Andarum"],
  "middle-ramu": ["Middle Ramu", "Aiome", "Simbai", "Josephstaal"],
  "rai-coast": ["Rai Coast", "Nahu Rawa", "Astrolabe Bay", "Saidor"],
  "sumkar": ["Sumkar", "Karkar Island", "Bagasin"],
  "usino-bundi": ["Usino", "Bundi", "Brahman"],
  "wewak": ["Wewak Urban", "Wewak Rural", "But-Dagua", "Yangoru"],
  "angoram": ["Angoram", "Karawari", "Blackwater", "Porapora"],
  "maprik": ["Maprik", "Albiges", "North Wosera"],
  "wosera-gawi": ["Wosera", "Gawi", "Tunai-Numbo"],
  "yangoru-saussia": ["Yangoru", "Saussia", "North Coast East Sepik"],
  "ambunti-dreikikir": ["Ambunti", "Dreikikir", "Wagu", "Gawanga"],
  "vanimo-green": ["Vanimo Urban", "Green River", "Kilimeri"],
  "nuku": ["Nuku", "Maimai", "Torricelli"],
  "aitape-lumi": ["Aitape Urban", "Lumi", "West Aitape", "Sissano"],
  "telefomin": ["Telefomin", "Oksapmin", "Tifalmin"],
  "manus": ["Lorengau Urban", "North Coast Manus", "South Coast Manus", "Islands"],
  "kavieng": ["Kavieng Urban", "Tikana", "Central New Ireland"],
  "namatanai": ["Namatanai Urban", "Sentral Niu Ailan", "Tanir-Lihir"],
  "rabaul": ["Rabaul Urban", "Livuan-Reimber", "Raluana", "Duke of York"],
  "kokopo": ["Kokopo Urban", "Vunamami", "Toma-Vunadidir", "Sinivit"],
  "gazelle": ["Gazelle", "Inland Baining", "Lassul-Baining"],
  "pomio": ["Pomio", "Bali-Witu", "Mamusi", "Melkoi"],
  "talasea": ["Talasea", "Hoskins Urban", "Bialla", "Ewase"],
  "kandrian-gloucester": ["Kandrian", "Gloucester", "Gasmata"],
  "north-bougainville": ["Buka Urban", "Halia", "Selau-Suir", "Kunua"],
  "central-bougainville": ["Kieta Urban", "Wakunai", "Panguna", "Eivo-Torau"],
  "south-bougainville": ["Buin", "Siwai", "Banoni-Torokina"]
};

function seededRandom(seed) {
  let x = seed;
  return function () {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

function generateWardsForLLG(llgName, targetVoters, rand) {
  const wardCount = Math.max(3, Math.min(12, Math.floor(rand() * 8) + 3));
  const wards = [];
  let remaining = targetVoters;

  for (let i = 0; i < wardCount; i++) {
    const isLast = i === wardCount - 1;
    const voters = isLast
      ? remaining
      : Math.max(100, Math.floor((remaining / (wardCount - i)) * (0.6 + rand() * 0.8)));
    remaining -= voters;
    if (remaining < 100 && !isLast) remaining = 100;

    wards.push({
      id: `${llgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}-w${String(i + 1).padStart(2, "0")}`,
      name: `Ward ${i + 1}`,
      registeredVoters: Math.max(50, voters),
    });
  }

  return wards;
}

mkdirSync(join(dataDir, "llgs"), { recursive: true });

for (const province of provinces) {
  const provElectorates = electorates.filter((e) => e.provinceId === province.id);
  if (provElectorates.length === 0) continue;

  const seed = province.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const electorateData = provElectorates.map((electorate) => {
    const names = llgNames[electorate.slug] || [`${electorate.name} Urban`, `${electorate.name} Rural`];
    const votersPerLLG = Math.floor(electorate.totalRegisteredVoters / names.length);

    const llgs = names.map((name, idx) => {
      const isLast = idx === names.length - 1;
      const target = isLast
        ? electorate.totalRegisteredVoters - votersPerLLG * idx
        : votersPerLLG + Math.floor((rand() - 0.5) * votersPerLLG * 0.3);

      return {
        id: `${electorate.slug}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")}`,
        name: `${name} LLG`,
        electorateSlug: electorate.slug,
        wards: generateWardsForLLG(name, Math.max(500, target), rand),
      };
    });

    return {
      electorateSlug: electorate.slug,
      llgs,
    };
  });

  const output = {
    provinceId: province.id,
    electorates: electorateData,
  };

  writeFileSync(
    join(dataDir, "llgs", `${province.id}.json`),
    JSON.stringify(output, null, 2)
  );

  console.log(`Generated ${province.id}.json (${provElectorates.length} electorates)`);
}

console.log("Done! Generated LLG data for all provinces.");
