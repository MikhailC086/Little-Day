import React, { useState, useMemo, useEffect, useContext, useRef } from "react";
import { supabase, backendReady } from "./supabaseClient.js";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  Sun, MapPin, Clock, DollarSign, Heart, ChevronLeft, ChevronRight,
  Home, Map as MapIcon, List as ListIcon, User, Sparkles, Droplets, Trees, Baby,
  ParkingCircle, ToggleLeft as Accessible, Utensils, Star, Navigation,
  Users, CheckCircle2, Cloud, CloudRain, UserPlus, Share2, Check, X, CalendarDays, Send, Shuffle, Bookmark, Moon, MessageCircle, Search, Flame, Plus, Trash2, HelpCircle, Phone, Shield
} from "lucide-react";

/* Persist state to this device's browser storage (survives refresh/close).
   Cleared only if the user clears browser data. */
function usePersistentState(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = window.localStorage.getItem("littleday." + key);
      return raw !== null ? JSON.parse(raw) : initial;
    } catch (e) { return initial; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("littleday." + key, JSON.stringify(val)); } catch (e) {}
  }, [key, val]);
  return [val, setVal];
}


/* ---------------------------------------------------------
   REAL PLACES — verified around Katonah, NY (10536), organized as
   a dense "core ring" (~everyday, <20 mi) plus an "adventure ring"
   (~worth-the-drive, 20–40 mi). Factual fields (name, town, address,
   category, price, website, description) are from public sources.
   Parent-sourced fields (bathrooms, changing table, shade, crowd,
   stroller, food) start UNRATED — the community fills them in.
--------------------------------------------------------- */
const UNRATED = null;

// Approximate coordinates [lat, lng] for map markers. Refine with exact
// values (or a geocoding pass) when you have time.
const COORDS = {
  "muscoot-farm": [41.2340, -73.7160], "katonah-library": [41.2585, -73.6857],
  "john-jay": [41.2466, -73.6636], "caramoor": [41.2430, -73.6670],
  "katonah-museum": [41.2450, -73.6760], "bedford-hills-library": [41.2340, -73.6940],
  "rockin-jump": [41.2160, -73.7270], "mtkisco-library": [41.2040, -73.7270],
  "ward-pound-ridge": [41.2560, -73.5880], "westmoreland": [41.1900, -73.6800],
  "outhouse-orchards": [41.3200, -73.6300], "stuarts-farm": [41.3000, -73.7700],
  "king-kone": [41.2500, -73.6800], "chappaqua-library": [41.1570, -73.7660],
  "stone-barns": [41.1070, -73.8380], "teatown": [41.2130, -73.8360],
  "kensico-dam": [41.0770, -73.7660], "saxon-woods": [40.9800, -73.7500],
  "greenburgh-nature": [41.0200, -73.8000], "westchester-childrens-museum": [40.9680, -73.6730],
  "playland": [40.9670, -73.6710], "maritime-aquarium": [41.0960, -73.4180],
  "stepping-stones": [41.1170, -73.4210], "hudson-river-museum": [40.9470, -73.8950],
  "legoland": [40.9600, -73.8600], "bronx-zoo": [40.8500, -73.8770],
  "blue-dolphin": [41.2590, -73.6850], "mtkisco-diner": [41.2040, -73.7230],
  "belizzie": [41.2045, -73.7250], "little-kebab": [41.2050, -73.7280],
  "taco-street": [41.1590, -73.7640], "table-nine": [41.3000, -73.9200], "bedford-hills-diner": [41.2360, -73.6950],
  "katonah-memorial-park": [41.2630, -73.6900], "leonard-park": [41.2100, -73.7350],
  "g-willikers": [41.2585, -73.6845], "all-together-now": [41.2045, -73.7270],
  "barnes-noble": [41.2030, -73.7300], "target-mtkisco": [41.1980, -73.7285],
  "rockefeller-park": [41.1060, -73.8370], "nannahagan-park": [41.1350, -73.7860],
  "jacob-burns": [41.1350, -73.7890], "lombardi-park": [41.1260, -73.7140],
  "mianus-gorge": [41.1870, -73.6230], "bedford-village-park": [41.2040, -73.6430],
  "fdr-state-park": [41.2830, -73.8330], "reis-park": [41.3300, -73.7000],
  "pierson-park": [41.0770, -73.8700], "kingsland-point": [41.0940, -73.8720],
  "philipsburg-manor": [41.0910, -73.8650], "sunnyside": [41.0450, -73.8680],
  "lighthouse-ice-cream": [41.0760, -73.8600], "blue-pig": [41.1910, -73.8880],
  "curious-on-hudson": [41.0140, -73.8740], "louis-engel-park": [41.1570, -73.8740],
  "van-cortlandt-manor": [41.1870, -73.8830], "rye-nature-center": [40.9820, -73.6900],
  "tibbetts-brook": [40.9180, -73.8790], "untermyer": [40.9720, -73.8930],
  "sky-zone-nr": [40.9120, -73.7830], "glen-island": [40.8950, -73.7850],
  "harbor-island": [40.9450, -73.7350],
  "world-cup-gym": [41.1620, -73.7720],
  "jodis-gym": [41.1950, -73.7350], "kidville": [41.1980, -73.7280],
  "armonk-sports": [41.1300, -73.7000], "kids-u": [41.1400, -73.7900],
  "amadeus-music": [41.1700, -73.7700], "weebop-music": [41.2000, -73.7300],
  "mike-risko-music": [41.1600, -73.8600], "logrea-dance": [41.1600, -73.8600],
  "breaking-ground-dance": [41.1400, -73.7900], "amaze-pottery": [41.1500, -73.8200],
  "katonah-art-center": [41.2000, -73.7200],
  "modern-martial-arts": [41.2160, -73.7270], "umac-briarcliff": [41.1450, -73.8250],
  "elev8-afterschool": [41.2340, -73.6940], "soccer-shots": [41.1570, -73.7660],
  "sports-squirts": [41.2040, -73.7280],
  "backyard-sports": [41.0280, -73.7650], "proswing-baseball": [41.2050, -73.7270],
  "kids-in-sports": [41.0050, -73.7950], "us-sports-institute": [41.1200, -73.7800],
  "mtkisco-rec": [41.2040, -73.7270],
  "saxon-woods-pool": [41.0090, -73.7440], "tibbetts-brook-pool": [40.9530, -73.8760],
  "willsons-waves": [40.9270, -73.8290], "sprain-ridge-pool": [40.9770, -73.8380],
  "lewisboro-pool": [41.2790, -73.5560],
  "katonah-memorial-pool": [41.2650, -73.6890], "bedford-hills-pool": [41.2430, -73.6990],
  "bedford-village-pool": [41.1970, -73.6420],
  "pleasantville-market": [41.1330, -73.7920], "chappaqua-market": [41.1570, -73.7690],
  "mtkisco-market": [41.2030, -73.7290], "tash-market": [41.0680, -73.8590], "roselle-park": [41.1420, -73.7830],
  "katonah-playcare": [41.2570, -73.6870], "katonah-village-kids": [41.2600, -73.6860],
  "little-feet-katonah": [41.2620, -73.6880], "mkccc": [41.2050, -73.7290],
  "kids-world-preschool": [41.1980, -73.7440], "landmark-preschool": [41.2040, -73.6440],
  "reading-room-katonah": [41.2585, -73.6860], "scattered-books": [41.1580, -73.7700],
  "hip-kid": [41.1570, -73.7690], "briarcliff-toyshop": [41.1480, -73.8250],
  "star-spangled-carousel": [41.1270, -73.7140], "lego-store-wp": [41.0340, -73.7620],
  "build-a-bear-wp": [41.0340, -73.7620], "millers-toy-store": [40.9490, -73.7350],
  "bronx-river-books": [40.9890, -73.8060], "womrath-bookshop": [40.9380, -73.8330],
};
function placeCoords(place) {
  const c = COORDS[place.id];
  return c ? { lat: c[0], lng: c[1] } : null;
}

// Google Maps key is injected at build time from VITE_GOOGLE_MAPS_API_KEY.
// If it's missing, the app gracefully falls back to the styled placeholder map.
const GMAPS_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || "";

const APP_BG = "#FFFBF5";

const PLACES = [
  // ---------- CORE RING ----------
  {
    id: "muscoot-farm", name: "Muscoot Farm", category: "Farm",
    tags: ["outdoor", "animals", "free", "nature"], ring: "core",
    town: "Katonah", address: "51 NY-100, Katonah, NY 10536",
    website: "muscootfarm.org", ageRange: "1–10", price: "Free", distanceMi: 4,
    photo: "🐐",
    blurb: "A free town-owned working farm with goats, cows, sheep, pigs and chickens, plus flat trails and seasonal weekend events. Stroller-friendly gravel paths.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "katonah-library", name: "Katonah Village Library", category: "Library",
    tags: ["indoor", "free", "rain-friendly", "learning"], ring: "core",
    town: "Katonah", address: "26 Bedford Rd, Katonah, NY 10536",
    website: "katonahlibrary.org", ageRange: "0–8", price: "Free", distanceMi: 1,
    photo: "📚",
    blurb: "The local village library, with children's storytimes, classes and an instrument-lending program. A reliable calm, indoor option on a hot or rainy day.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "john-jay", name: "John Jay Homestead", category: "Historic Site",
    tags: ["outdoor", "free", "nature", "learning"], ring: "core",
    town: "Katonah", address: "400 Jay St, Katonah, NY 10536",
    website: "johnjayhomestead.org", ageRange: "2–10", price: "Free grounds", distanceMi: 3,
    photo: "🏛️",
    blurb: "A historic estate with open grounds, walking paths, a farm area and family events. Grounds are free to roam; some indoor tours and programs are ticketed.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "caramoor", name: "Caramoor Center for Music and the Arts", category: "Gardens & Arts",
    tags: ["outdoor", "nature", "learning"], ring: "core",
    town: "Katonah", address: "149 Girdle Ridge Rd, Katonah, NY 10536",
    website: "caramoor.org", ageRange: "2–10", price: "$ grounds", distanceMi: 2,
    photo: "🎶",
    blurb: "An 80-acre estate with gardens, outdoor sound-art installations you can walk through, picnicking, and family and kids' concerts through the season.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "katonah-museum", name: "Katonah Museum of Art", category: "Museum",
    tags: ["indoor", "rain-friendly", "learning"], ring: "core",
    town: "Katonah", address: "134 Jay St, Katonah, NY 10536",
    website: "katonahmuseum.org", ageRange: "2–10", price: "$", distanceMi: 2,
    photo: "🖼️",
    blurb: "A small art museum with rotating exhibits and family programming, including stroller tours and Friday creative-community sessions for little ones.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "bedford-hills-library", name: "Bedford Hills Free Library", category: "Library",
    tags: ["indoor", "free", "rain-friendly", "learning"], ring: "core",
    town: "Bedford Hills", address: "26 Main St, Bedford Hills, NY 10507",
    website: "bhfreelibrary.org", ageRange: "0–8", price: "Free", distanceMi: 4,
    photo: "📖",
    blurb: "Neighborhood library with children's storytimes and STEAM programs. Another good rainy-day reset that's close to home.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "rockin-jump", name: "Rockin' Jump Trampoline Park", category: "Indoor Playground",
    tags: ["indoor", "rain-friendly", "active", "paid"], ring: "core",
    town: "Mount Kisco", address: "333 N Bedford Rd, Mount Kisco, NY 10549",
    website: "rockinjump.com", ageRange: "3–10", price: "$$", distanceMi: 6,
    photo: "🤸",
    blurb: "Indoor trampoline park with open jump, dodgeball and ninja-style courses. Good energy-burner for a rainy day; toddler jump times are usually offered — check the schedule.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "mtkisco-library", name: "Mount Kisco Public Library", category: "Library",
    tags: ["indoor", "free", "rain-friendly", "learning"], ring: "core",
    town: "Mount Kisco", address: "100 E Main St, Mount Kisco, NY 10549",
    website: "mountkiscolibrary.org", ageRange: "0–8", price: "Free", distanceMi: 6,
    photo: "📚",
    blurb: "Larger area library with a children's room and regular family programs. Central Mount Kisco location near shops and lunch spots.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Municipal lots",
  },
  {
    id: "ward-pound-ridge", name: "Ward Pound Ridge Reservation", category: "Nature Center",
    tags: ["outdoor", "nature", "hiking"], ring: "core",
    town: "Cross River", address: "6 Reservation Rd, Cross River, NY 10518",
    website: "parks.westchestergov.com", ageRange: "2–10", price: "$ parking", distanceMi: 6,
    photo: "🌲",
    blurb: "Westchester's largest park — 4,300+ acres with easy family trails and the Trailside Nature Museum. Beginner loops are manageable for little legs.",
    changingTable: UNRATED, stroller: UNRATED, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Paid lot",
  },
  {
    id: "westmoreland", name: "Westmoreland Sanctuary", category: "Nature Center",
    tags: ["outdoor", "free", "nature", "hiking"], ring: "core",
    town: "Mount Kisco", address: "260 Chestnut Ridge Rd, Mount Kisco, NY 10549",
    website: "westmorelandsanctuary.org", ageRange: "3–10", price: "Free", distanceMi: 7,
    photo: "🦉",
    blurb: "A quiet nature preserve with marked trails and a nature museum. Good starter hikes and frequent family nature programs.",
    changingTable: UNRATED, stroller: false, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "outhouse-orchards", name: "Outhouse Orchards", category: "Farm",
    tags: ["outdoor", "food", "seasonal", "animals"], ring: "core",
    town: "North Salem", address: "139 Hardscrabble Rd, North Salem, NY 10560",
    website: "outhouseorchards.net", ageRange: "1–10", price: "$", distanceMi: 8,
    photo: "🍎",
    blurb: "Pick-your-own orchard with apples in fall and a seasonal fall festival. Wide-open rows are easy for kids to run; busiest on autumn weekends.",
    changingTable: UNRATED, stroller: UNRATED, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Field parking",
  },
  {
    id: "stuarts-farm", name: "Stuart's Fruit Farm", category: "Farm",
    tags: ["outdoor", "food", "seasonal"], ring: "core",
    town: "Granite Springs", address: "62 Granite Springs Rd, Granite Springs, NY 10527",
    website: "stuartsfarm.com", ageRange: "1–10", price: "$", distanceMi: 9,
    photo: "🎃",
    blurb: "A longtime family fruit farm known for apple and pumpkin picking in the fall. Classic pick-your-own outing close to home.",
    changingTable: UNRATED, stroller: UNRATED, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Field parking",
  },
  {
    id: "king-kone", name: "King Kone", category: "Ice Cream",
    tags: ["food", "treat"], ring: "core",
    town: "Katonah area", address: "", website: "",
    ageRange: "All ages", price: "$", distanceMi: 7, photo: "🍦",
    blurb: "A local soft-serve and ice-cream stand — the kind of easy treat stop that makes a nice end to a Little Day. (Hours are seasonal — worth a quick check before you go.)",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: UNRATED,
  },
  {
    id: "chappaqua-library", name: "Chappaqua Library", category: "Library",
    tags: ["indoor", "free", "rain-friendly", "learning"], ring: "core",
    town: "Chappaqua", address: "195 S Greeley Ave, Chappaqua, NY 10514",
    website: "chappaqualibrary.org", ageRange: "0–8", price: "Free", distanceMi: 8,
    photo: "📗",
    blurb: "Well-regarded library with storytimes and children's programming, plus a nice outdoor area. Easy pairing with lunch in downtown Chappaqua.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "stone-barns", name: "Stone Barns Center", category: "Farm",
    tags: ["outdoor", "animals", "nature", "learning"], ring: "core",
    town: "Pocantico Hills", address: "630 Bedford Rd, Pocantico Hills, NY 10591",
    website: "stonebarnscenter.org", ageRange: "1–10", price: "$ / events", distanceMi: 14,
    photo: "🐑",
    blurb: "A beautiful sustainable farm with animals, gardens and kid-friendly workshops. Weekends are popular — buying tickets in advance is recommended.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "teatown", name: "Teatown Lake Reservation", category: "Nature Center",
    tags: ["outdoor", "free", "nature", "hiking", "animals"], ring: "core",
    town: "Ossining", address: "1600 Spring Valley Rd, Ossining, NY 10562",
    website: "teatown.org", ageRange: "2–10", price: "Free trails", distanceMi: 14,
    photo: "🦌",
    blurb: "875 acres of trails plus a nature center with live animals and family programs. Gentle lakeside loops are good starter hikes for young kids.",
    changingTable: UNRATED, stroller: UNRATED, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "kensico-dam", name: "Kensico Dam Plaza", category: "Park",
    tags: ["outdoor", "free", "active"], ring: "core",
    town: "Valhalla", address: "1 Bronx River Pkwy, Valhalla, NY 10595",
    website: "parks.westchestergov.com", ageRange: "1–10", price: "Free", distanceMi: 16,
    photo: "🏞️",
    blurb: "A huge open plaza at the base of the dam — great for biking, scooters, running around and picnics, and home to seasonal festivals and events.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Limited", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "saxon-woods", name: "Saxon Woods Park", category: "Playground",
    tags: ["outdoor", "playground", "water"], ring: "core",
    town: "White Plains", address: "1800 Mamaroneck Ave, White Plains, NY 10605",
    website: "parks.westchestergov.com", ageRange: "1–10", price: "$ pool", distanceMi: 18,
    photo: "🛝",
    blurb: "A large county park with a shaded playground, trails and a seasonal pool with a spray/splash area. Bring the county Park Pass for the best rates.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Good", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "greenburgh-nature", name: "Greenburgh Nature Center", category: "Nature Center",
    tags: ["outdoor", "indoor", "animals", "nature", "learning"], ring: "core",
    town: "Scarsdale", address: "99 Dromore Rd, Scarsdale, NY 10583",
    website: "greenburghnaturecenter.org", ageRange: "1–8", price: "$", distanceMi: 18,
    photo: "🦔",
    blurb: "A 33-acre preserve with indoor live-animal exhibits, an outdoor aviary, a playground and trails. Small enough for toddlers, with lots to see.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },

  // ---------- ADVENTURE RING ----------
  {
    id: "westchester-childrens-museum", name: "Westchester Children's Museum", category: "Children's Museum",
    tags: ["indoor", "rain-friendly", "learning", "paid"], ring: "adventure",
    town: "Rye", address: "100 Playland Pkwy, Rye, NY 10580",
    website: "discoverwcm.org", ageRange: "1–10", price: "$$", distanceMi: 22,
    photo: "🔬",
    blurb: "Hands-on exhibits in science, art, water play and building — designed for toddlers through tweens. A go-to rainy-day 'big adventure.' Usually open Wed–Sun.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "playland", name: "Playland Amusement Park", category: "Amusement Park",
    tags: ["outdoor", "active", "water", "seasonal", "paid"], ring: "adventure",
    town: "Rye", address: "1 Playland Pkwy, Rye, NY 10580",
    website: "playland.com", ageRange: "2–10", price: "$$$", distanceMi: 22,
    photo: "🎡",
    blurb: "Historic lakeside amusement park with a dedicated Kiddyland of gentle rides, plus a boardwalk and beach. Seasonal — best on a clear summer day.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "Limited", bathrooms: UNRATED, parking: "Paid lot",
  },
  {
    id: "maritime-aquarium", name: "The Maritime Aquarium at Norwalk", category: "Aquarium",
    tags: ["indoor", "rain-friendly", "animals", "learning", "paid"], ring: "adventure",
    town: "Norwalk, CT", address: "10 N Water St, Norwalk, CT 06854",
    website: "maritimeaquarium.org", ageRange: "1–10", price: "$$$", distanceMi: 24,
    photo: "🦈",
    blurb: "Sharks, seals, rays and touch tanks focused on Long Island Sound, plus a 4D theater. Open daily 10–5. Kids' tickets run about $30 — buy online in advance.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Covered garage next door",
  },
  {
    id: "stepping-stones", name: "Stepping Stones Museum for Children", category: "Children's Museum",
    tags: ["indoor", "rain-friendly", "learning", "paid"], ring: "adventure",
    town: "Norwalk, CT", address: "303 West Ave, Norwalk, CT 06850",
    website: "steppingstonesmuseum.org", ageRange: "1–8", price: "$$", distanceMi: 24,
    photo: "🧩",
    blurb: "A top-rated children's museum with science, art, reading and pretend-play exhibits. Quieter hours tend to be weekday afternoons; a family bathroom is up front.",
    changingTable: true, stroller: true, food: UNRATED, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "hudson-river-museum", name: "Hudson River Museum & Planetarium", category: "Museum",
    tags: ["indoor", "rain-friendly", "learning", "paid"], ring: "adventure",
    town: "Yonkers", address: "511 Warburton Ave, Yonkers, NY 10701",
    website: "hrm.org", ageRange: "3–10", price: "$$", distanceMi: 24,
    photo: "🪐",
    blurb: "Art and science galleries plus a planetarium with family star shows, overlooking the Hudson. First Friday evenings each month are free admission.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "legoland", name: "LEGOLAND Discovery Center Westchester", category: "Indoor Playground",
    tags: ["indoor", "rain-friendly", "active", "paid"], ring: "adventure",
    town: "Yonkers", address: "Ridge Hill, Yonkers, NY 10710",
    website: "legolanddiscoverycenter.com", ageRange: "2–10", price: "$$$", distanceMi: 25,
    photo: "🧱",
    blurb: "Indoor LEGO play zone with build areas, a soft-play space, rides and a 4D cinema. Great rainy-day option — book timed tickets online to save.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Mall garage",
  },
  {
    id: "bronx-zoo", name: "Bronx Zoo", category: "Zoo",
    tags: ["outdoor", "animals", "nature", "paid"], ring: "adventure",
    town: "Bronx", address: "2300 Southern Blvd, Bronx, NY 10460",
    website: "bronxzoo.com", ageRange: "1–10", price: "$$$", distanceMi: 35,
    photo: "🦁",
    blurb: "One of the world's great zoos, with a Children's Zoo and lots of stroller-friendly paths. A full 'Big Adventure' day — go early and pace it for nap time.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "Mixed", bathrooms: UNRATED, parking: "Paid lot",
  },

  // ---------- RESTAURANTS & PLAYGROUNDS ----------
  {
    id: "blue-dolphin", name: "Blue Dolphin", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Katonah", address: "175 Katonah Ave, Katonah, NY 10536",
    website: "", ageRange: "All ages", price: "$", distanceMi: 1,
    photo: "🍽️",
    blurb: "A longtime Katonah spot for casual Italian and diner-style comfort food — an easy, unfussy sit-down lunch close to home.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Street parking",
  },
  {
    id: "mtkisco-diner", name: "Mt. Kisco Diner", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Mount Kisco", address: "252 E Main St, Mount Kisco, NY 10549",
    website: "", ageRange: "All ages", price: "$", distanceMi: 6,
    photo: "🥞",
    blurb: "A beloved classic diner — big menu, specialty pancakes and over-the-top milkshakes. A local go-to for birthday brunches with kids.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Lot + street",
  },
  {
    id: "belizzie", name: "Belizzie", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly", "active"], ring: "core",
    town: "Mount Kisco", address: "153 E Main St, Mount Kisco, NY 10549",
    website: "", ageRange: "1–10", price: "$$", distanceMi: 6,
    photo: "🍕",
    blurb: "More than a pizza place — arcade games, a small toddler play-and-reading nook, and a kids' menu with food, gelato and game tokens. A parent favorite for easy meals.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Municipal lots",
  },
  {
    id: "little-kebab", name: "Little Kebab Station", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Mount Kisco", address: "31 E Main St, Mount Kisco, NY 10549",
    website: "", ageRange: "All ages", price: "$", distanceMi: 6,
    photo: "🍛",
    blurb: "Small, casual Indian spot with delicious, authentic food that arrives fast — always a plus with little ones in tow.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Municipal lots",
  },
  {
    id: "taco-street", name: "Taco Street", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Chappaqua", address: "Chappaqua, NY 10514",
    website: "", ageRange: "All ages", price: "$", distanceMi: 8,
    photo: "🌮",
    blurb: "Casual tacos with bench seating and a garage-style door that opens up. Staff are warm with kids — chocolate milk and sauce-on-the-side handled before you ask.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Street parking",
  },
  {
    id: "table-nine", name: "Table 9", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Cortlandt Manor", address: "Annsville Circle, Cortlandt Manor, NY",
    website: "tablenine.com", ageRange: "All ages", price: "$$", distanceMi: 13,
    photo: "🍽️",
    blurb: "An American-style family restaurant built around exactly that. Comfort food plus gluten-free, vegetarian and low-sodium options, and a menu friendly to picky eaters.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "katonah-memorial-park", name: "Katonah Memorial Park", category: "Playground",
    tags: ["outdoor", "playground", "water", "free"], ring: "core",
    town: "Katonah", address: "Memorial Park, Katonah, NY 10536",
    website: "", ageRange: "1–10", price: "Free park", distanceMi: 1,
    photo: "🛝",
    blurb: "The town park — playground, ball fields and a seasonal pool. The closest easy 'run around' option to central Katonah.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "leonard-park", name: "Leonard Park", category: "Playground",
    tags: ["outdoor", "playground", "water", "free"], ring: "core",
    town: "Mount Kisco", address: "Leonard Park, Mount Kisco, NY 10549",
    website: "", ageRange: "1–10", price: "Free park", distanceMi: 6,
    photo: "🎠",
    blurb: "A well-loved Mount Kisco park with a playground, a pond and a seasonal pool — a solid warm-weather afternoon.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Good", bathrooms: UNRATED, parking: "Free lot",
  },

  {
    id: "bedford-hills-diner", name: "Bedford Hills Diner", category: "Restaurant",
    tags: ["food", "indoor", "rain-friendly"], ring: "core",
    town: "Bedford Hills", address: "626 Bedford Rd, Bedford Hills, NY 10507",
    website: "", ageRange: "All ages", price: "$", distanceMi: 3,
    photo: "🍴",
    blurb: "A classic local diner that goes big on families — including a free Family Fun Night every Tuesday evening with special guest characters. Call ahead to reserve a table.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  // ---------- TOY & GIFT SHOPS ----------
  {
    id: "g-willikers", name: "G. Willikers", category: "Toy Store",
    tags: ["indoor", "gifts", "shopping", "rain-friendly"], ring: "core",
    town: "Katonah", address: "29 Katonah Ave, Katonah, NY 10536",
    website: "gwillikers.com", ageRange: "0–10", price: "Free entry", distanceMi: 1,
    photo: "🧸",
    blurb: "A family-owned Katonah toy shop with a handpicked selection of toys and games for all ages. Great for a birthday-gift run or a rainy-day browse. Wheelchair accessible, free lot parking.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "all-together-now", name: "All Together Now Kids", category: "Toy Store",
    tags: ["indoor", "gifts", "shopping", "rain-friendly"], ring: "core",
    town: "Mount Kisco", address: "Mount Kisco, NY 10549",
    website: "alltogethernowkids.com", ageRange: "0–10", price: "Free entry", distanceMi: 6,
    photo: "🎁",
    blurb: "A local children's store with toys, books, crafts and baby clothes — plus an on-site photo studio. A nice one-stop for gifts, with something for the grown-ups too.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Municipal lots",
  },

  {
    id: "barnes-noble", name: "Barnes & Noble", category: "Bookstore",
    tags: ["indoor", "gifts", "shopping", "learning", "rain-friendly"], ring: "core",
    town: "Mount Kisco", address: "55-59 S Moger Ave, Mount Kisco, NY 10549",
    website: "barnesandnoble.com", ageRange: "0–10", price: "Free entry", distanceMi: 7,
    photo: "📚",
    blurb: "The big bookstore — a huge kids' book and toy section, a café, and free children's storytimes (check the events page). A dependable rainy-day browse and gift stop.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "target-mtkisco", name: "Target", category: "Store",
    tags: ["indoor", "gifts", "shopping"], ring: "core",
    town: "Mount Kisco", address: "Mount Kisco, NY 10549",
    website: "target.com", ageRange: "0–10", price: "Free entry", distanceMi: 6,
    photo: "🎯",
    blurb: "The one-stop for toys, gifts, clothes and last-minute birthday-party supplies. Not a day out, but handy when you need a gift on the way somewhere.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },

  // ---------- SURROUNDING TOWNS ----------
  {
    id: "rockefeller-park", name: "Rockefeller State Park Preserve", category: "Nature Center",
    tags: ["outdoor", "nature", "hiking"], ring: "core",
    town: "Pleasantville", address: "125 Phelps Way, Pleasantville, NY 10570",
    website: "parks.ny.gov", ageRange: "2–10", price: "$ parking", distanceMi: 14,
    photo: "🌲",
    blurb: "Wide, well-groomed carriage roads make this one of the most stroller-friendly places to hike in the county, around a pretty lake. Grounds dawn to dusk; small parking fee.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Paid lot",
  },
  {
    id: "nannahagan-park", name: "Nannahagan Park", category: "Playground",
    tags: ["outdoor", "playground", "free"], ring: "core",
    town: "Pleasantville", address: "232 Lake St, Pleasantville, NY 10570",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 10,
    photo: "🛝",
    blurb: "A freshly overhauled playground (rebuilt 2024) with modern equipment and green space — a great, easy stop in Pleasantville.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "jacob-burns", name: "Jacob Burns Film Center", category: "Cinema",
    tags: ["indoor", "rain-friendly", "learning"], ring: "core",
    town: "Pleasantville", address: "364 Manville Rd, Pleasantville, NY 10570",
    website: "burnsfilmcenter.org", ageRange: "3–10", price: "$$", distanceMi: 10,
    photo: "🎬",
    blurb: "A nonprofit five-screen cinema with a dedicated JBFC Kids program introducing young audiences to films from around the world. A lovely rainy-day outing.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot + street",
  },
  {
    id: "lombardi-park", name: "John A. Lombardi Park", category: "Playground",
    tags: ["outdoor", "playground", "free", "active"], ring: "core",
    town: "Armonk", address: "85 Cox Ave, Armonk, NY 10504",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 9,
    photo: "🎠",
    blurb: "An Armonk community park with a children's playground, ball fields and a community center — plenty of room to run.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "mianus-gorge", name: "Mianus River Gorge", category: "Nature Center",
    tags: ["outdoor", "nature", "hiking", "free"], ring: "core",
    town: "Bedford", address: "167 Mianus River Rd, Bedford, NY 10506",
    website: "mianus.org", ageRange: "3–10", price: "Free", distanceMi: 7,
    photo: "🌲",
    blurb: "A quiet old-growth preserve with gentle starter trails along a river gorge — a good first 'real hike' for little legs. Free; open seasonally, dawn to dusk.",
    changingTable: UNRATED, stroller: false, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "bedford-village-park", name: "Bedford Village Park", category: "Playground",
    tags: ["outdoor", "playground", "free"], ring: "core",
    town: "Bedford", address: "Bedford, NY 10506",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 4,
    photo: "🛝",
    blurb: "Just outside Bedford's historic downtown, with play options for every age group and open green space for a picnic.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "fdr-state-park", name: "FDR State Park", category: "Park",
    tags: ["outdoor", "playground", "water", "hiking"], ring: "core",
    town: "Yorktown Heights", address: "2957 Crompond Rd, Yorktown Heights, NY 10598",
    website: "parks.ny.gov", ageRange: "1–10", price: "$ parking", distanceMi: 11,
    photo: "🏞️",
    blurb: "A big state park with a lake, a seasonal pool, playgrounds, trails and picnic areas — an easy all-day option. Small parking fee in season.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Mixed", bathrooms: UNRATED, parking: "Paid lot (seasonal)",
  },
  {
    id: "reis-park", name: "Reis Park", category: "Playground",
    tags: ["outdoor", "playground", "water", "free", "active"], ring: "core",
    town: "Somers", address: "Reis Park, Somers, NY 10589",
    website: "", ageRange: "1–10", price: "Free park", distanceMi: 9,
    photo: "⚽",
    blurb: "Somers' main rec park — playground, ball fields and a seasonal pool. A reliable spot to burn off energy.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },

  // ---------- COUNTYWIDE: RIVERTOWNS, SOUND SHORE, LOWER WESTCHESTER ----------
  {
    id: "pierson-park", name: "Pierson Park", category: "Playground",
    tags: ["outdoor", "playground", "water", "free"], ring: "adventure",
    town: "Tarrytown", address: "238 W Main St, Tarrytown, NY 10591",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 16,
    photo: "🛝",
    blurb: "A renovated riverfront park with a free splash pad, playground and the smooth, stroller-friendly Scenic Hudson RiverWalk right alongside — big Tappan Zee views.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "kingsland-point", name: "Kingsland Point Park", category: "Park",
    tags: ["outdoor", "free", "nature", "water"], ring: "adventure",
    town: "Sleepy Hollow", address: "Palmer Ave, Sleepy Hollow, NY 10591",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 17,
    photo: "🌅",
    blurb: "A Hudson-front county park with open lawns, a playground and views of the Sleepy Hollow Lighthouse. A calm spot for a picnic and a riverside run-around.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "philipsburg-manor", name: "Philipsburg Manor", category: "Historic Site",
    tags: ["outdoor", "learning", "animals", "seasonal"], ring: "adventure",
    town: "Sleepy Hollow", address: "381 N Broadway, Sleepy Hollow, NY 10591",
    website: "visitsleepyhollow.com", ageRange: "3–10", price: "$$", distanceMi: 17,
    photo: "🏰",
    blurb: "A living-history farm where costumed guides show life in 1750 — farm animals, a working mill and hands-on demos. Very popular in the Halloween season.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "sunnyside", name: "Washington Irving's Sunnyside", category: "Historic Site",
    tags: ["outdoor", "learning"], ring: "adventure",
    town: "Irvington", address: "3 W Sunnyside Ln, Irvington, NY 10533",
    website: "visitsleepyhollow.com", ageRange: "4–10", price: "$$", distanceMi: 18,
    photo: "🏡",
    blurb: "The storybook riverside home of author Washington Irving, with pretty grounds to explore and short guided tours. Nice for a gentle history outing with older kids.",
    changingTable: UNRATED, stroller: false, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "lighthouse-ice-cream", name: "Lighthouse Ice Cream Kompany", category: "Ice Cream",
    tags: ["food", "treat"], ring: "adventure",
    town: "Tarrytown", address: "127 W Main St, Tarrytown, NY 10591",
    website: "", ageRange: "All ages", price: "$", distanceMi: 16,
    photo: "🍦",
    blurb: "A cheerful Tarrytown scoop shop — the perfect frozen treat to cap a RiverWalk stroll or a day in the rivertowns.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Street parking",
  },
  {
    id: "blue-pig", name: "The Blue Pig", category: "Ice Cream",
    tags: ["food", "treat"], ring: "adventure",
    town: "Croton-on-Hudson", address: "121 Maple St, Croton-on-Hudson, NY 10520",
    website: "", ageRange: "All ages", price: "$", distanceMi: 18,
    photo: "🍨",
    blurb: "A beloved little ice-cream shop making small-batch flavors from organic, local ingredients. The line can be out the door — no one seems to mind.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: UNRATED, bathrooms: UNRATED, parking: "Street parking",
  },
  {
    id: "curious-on-hudson", name: "Curious-on-Hudson", category: "Kids' Studio",
    tags: ["indoor", "learning", "rain-friendly"], ring: "adventure",
    town: "Dobbs Ferry", address: "145 Palisades St, Dobbs Ferry, NY 10522",
    website: "curiousonhudson.com", ageRange: "3–10", price: "$$", distanceMi: 20,
    photo: "🎨",
    blurb: "Airy, art-filled studios in a renovated brewery running hands-on kids' workshops — art, engineering, coding and more. A creative rainy-day option; classes often bookable.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "louis-engel-park", name: "Louis Engel Waterfront Park", category: "Playground",
    tags: ["outdoor", "playground", "water", "free"], ring: "core",
    town: "Ossining", address: "Westerly Rd, Ossining, NY 10562",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 13,
    photo: "💦",
    blurb: "A riverfront park with a playground, Ossining's outdoor spray park, picnic tables and Hudson views. A great free warm-weather stop.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "van-cortlandt-manor", name: "Van Cortlandt Manor", category: "Historic Site",
    tags: ["outdoor", "learning", "seasonal"], ring: "adventure",
    town: "Croton-on-Hudson", address: "500 S Riverside Ave, Croton-on-Hudson, NY 10520",
    website: "visitsleepyhollow.com", ageRange: "4–10", price: "$$", distanceMi: 19,
    photo: "🏛️",
    blurb: "A preserved Revolutionary-era estate where families can step back in time. Home to the wildly popular Great Jack O'Lantern Blaze in the fall.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "rye-nature-center", name: "Rye Nature Center", category: "Nature Center",
    tags: ["outdoor", "nature", "hiking", "animals"], ring: "adventure",
    town: "Rye", address: "873 Boston Post Rd, Rye, NY 10580",
    website: "ryenaturecenter.org", ageRange: "2–10", price: "$", distanceMi: 22,
    photo: "🦋",
    blurb: "A 47-acre preserve with easy trails, a small animal collection and family nature programs — a gentle, green escape on the Sound Shore.",
    changingTable: UNRATED, stroller: UNRATED, food: false, crowd: UNRATED, shade: "Wooded", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "tibbetts-brook", name: "Tibbetts Brook Park", category: "Park",
    tags: ["outdoor", "playground", "water", "active"], ring: "adventure",
    town: "Yonkers", address: "355 Midland Ave, Yonkers, NY 10704",
    website: "parks.westchestergov.com", ageRange: "1–10", price: "$ parking", distanceMi: 26,
    photo: "🏊",
    blurb: "A big county park with a seasonal pool complex, playgrounds, paddle boats and shady picnic groves. A classic all-day summer outing.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Good", bathrooms: UNRATED, parking: "Paid lot (seasonal)",
  },
  {
    id: "untermyer", name: "Untermyer Park & Gardens", category: "Gardens",
    tags: ["outdoor", "nature", "free"], ring: "adventure",
    town: "Yonkers", address: "945 N Broadway, Yonkers, NY 10701",
    website: "untermyergardens.org", ageRange: "2–10", price: "Free", distanceMi: 25,
    photo: "🌷",
    blurb: "Stunning free public gardens with fountains, staircases and sweeping Hudson views — a beautiful, easy stroll that feels like a mini-adventure for little explorers.",
    changingTable: UNRATED, stroller: UNRATED, food: false, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "sky-zone-nr", name: "Sky Zone Trampoline Park", category: "Indoor Playground",
    tags: ["indoor", "active", "rain-friendly", "paid"], ring: "adventure",
    town: "New Rochelle", address: "New Rochelle, NY 10801",
    website: "skyzone.com", ageRange: "3–10", price: "$$", distanceMi: 28,
    photo: "🤸",
    blurb: "Wall-to-wall trampolines, a warrior course and toddler jump times — a big energy-burner for a rainy or cold day. Check the schedule for little-kid sessions.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "glen-island", name: "Glen Island Park", category: "Park",
    tags: ["outdoor", "water", "nature"], ring: "adventure",
    town: "New Rochelle", address: "Weyman Ave, New Rochelle, NY 10805",
    website: "parks.westchestergov.com", ageRange: "1–10", price: "$ parking", distanceMi: 30,
    photo: "🏖️",
    blurb: "A Long Island Sound park with a sandy beach, picnic areas and sweeping water views. Bring the county Park Pass for the best rate.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Paid lot (seasonal)",
  },
  {
    id: "harbor-island", name: "Harbor Island Park", category: "Park",
    tags: ["outdoor", "playground", "water", "free"], ring: "adventure",
    town: "Mamaroneck", address: "Mamaroneck Ave, Mamaroneck, NY 10543",
    website: "", ageRange: "1–10", price: "Free", distanceMi: 28,
    photo: "⛱️",
    blurb: "A Sound-front town park with a beach, playground and open green space — host to free summer family movie nights and a campout.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "world-cup-gym", name: "World Cup Gymnastics", category: "Gym & Classes",
    tags: ["indoor", "active", "rain-friendly", "learning"], ring: "core",
    town: "Chappaqua", address: "170 Joan Corwin Way, Chappaqua, NY 10514",
    website: "worldcupgymnastics.com", ageRange: "0–10", price: "$$", distanceMi: 8,
    photo: "🤸",
    blurb: "A 19,000 sq ft gymnastics center with a dedicated preschool gym, recreational classes, Ninja, camps and birthday parties. A local favorite for burning energy and building confidence — free trial lesson available.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },

  // ---------- KIDS' CLASSES & ACTIVITY CENTERS ----------
  {
    id: "jodis-gym", name: "Jodi's Gym", category: "Gym & Classes",
    tags: ["indoor", "active", "rain-friendly", "learning", "classes"], ring: "core",
    town: "Mount Kisco", address: "25 Hubbels Dr, Mount Kisco, NY 10549",
    website: "jodisgym.com", ageRange: "0–10", price: "$$", distanceMi: 6,
    photo: "🤸",
    blurb: "A beloved local gym for ages 9 months to 14 years — playtime for babies, Mighty Muscle Movers, tumbling, and a Ninja Challenge, plus camps and parties.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "kidville", name: "Kidville", category: "Gym & Classes",
    tags: ["indoor", "active", "rain-friendly", "learning", "classes"], ring: "core",
    town: "Mount Kisco", address: "145 Kisco Ave, Mount Kisco, NY 10549",
    website: "kidville.com", ageRange: "0–5", price: "$$", distanceMi: 6,
    photo: "🧸",
    blurb: "For the 5-and-under set: gymnastics, music, art, science and dance classes, plus member open-play hours, camps and parties. A great little-kid all-rounder.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "armonk-sports", name: "Armonk Indoor Sports Center", category: "Gym & Classes",
    tags: ["indoor", "active", "rain-friendly", "classes"], ring: "core",
    town: "Armonk", address: "205 Business Park Dr, Armonk, NY 10504",
    website: "", ageRange: "3–10", price: "$$", distanceMi: 9,
    photo: "⚽",
    blurb: "An indoor sports facility with programs, clinics and open play for active kids — a solid rainy-day energy-burner in Armonk.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "kids-u", name: "Kids U", category: "Kids' Studio",
    tags: ["indoor", "learning", "rain-friendly", "classes"], ring: "core",
    town: "Pleasantville", address: "175 Tompkins Ave, Pleasantville, NY 10570",
    website: "", ageRange: "0–8", price: "$$", distanceMi: 10,
    photo: "🧩",
    blurb: "A Pleasantville enrichment and play program with classes and activities for young children — a warm, hands-on indoor option.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "amadeus-music", name: "Amadeus Conservatory of Music", category: "Music Classes",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Chappaqua", address: "201 King St, Chappaqua, NY 10514",
    website: "amadeusconservatory.com", ageRange: "3–10", price: "$$", distanceMi: 8,
    photo: "🎻",
    blurb: "A community music school offering early-childhood music, private lessons and group classes across instruments — a lovely place to spark a musical start.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "weebop-music", name: "WeeBop Mommy & Me Music", category: "Music Classes",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Mount Kisco", address: "77 Kensico Dr, Mount Kisco, NY 10549",
    website: "weebop.com", ageRange: "0–5", price: "$$", distanceMi: 6,
    photo: "🎵",
    blurb: "Interactive mommy-and-me music classes full of songs, movement and instruments for babies and toddlers. A joyful first music experience.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "mike-risko-music", name: "Mike Risko Music School", category: "Music Classes",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Ossining", address: "144 Croton Ave, Ossining, NY 10562",
    website: "mikeriskomusic.com", ageRange: "3–10", price: "$$", distanceMi: 14,
    photo: "🎸",
    blurb: "A friendly family music school with lessons and group classes for all ages and instruments, plus rock-band programs for older kids.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "logrea-dance", name: "Logrea Dance Academy", category: "Dance Classes",
    tags: ["indoor", "active", "learning", "classes"], ring: "core",
    town: "Ossining", address: "2 Dale Ave, Ossining, NY 10562",
    website: "logreadanceacademy.com", ageRange: "2–10", price: "$$", distanceMi: 14,
    photo: "🩰",
    blurb: "A long-established academy teaching ballet and classical technique to children of all levels, in a nurturing, disciplined setting.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "breaking-ground-dance", name: "Breaking Ground Dance Center", category: "Dance Classes",
    tags: ["indoor", "active", "learning", "classes"], ring: "core",
    town: "Pleasantville", address: "101 Castleton St, Pleasantville, NY 10570",
    website: "breakinggrounddance.com", ageRange: "2–10", price: "$$", distanceMi: 10,
    photo: "💃",
    blurb: "A welcoming dance studio with classes from first-time movers through advanced — ballet, tap, jazz, hip hop and more, plus recitals.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "amaze-pottery", name: "Amaze in Pottery", category: "Art Studio",
    tags: ["indoor", "learning", "rain-friendly", "classes"], ring: "core",
    town: "Briarcliff Manor", address: "76 North State Rd, Briarcliff Manor, NY 10510",
    website: "amazeinpottery.com", ageRange: "3–10", price: "$$", distanceMi: 13,
    photo: "🏺",
    blurb: "A paint-your-own pottery and art studio — drop in to decorate a piece, or join a class. A cozy, creative rainy-day standby.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "katonah-art-center", name: "Katonah Art Center", category: "Art Studio",
    tags: ["indoor", "learning", "rain-friendly", "classes"], ring: "core",
    town: "Mount Kisco", address: "40 Radio Circle Dr, Mount Kisco, NY 10549",
    website: "katonahartcenter.com", ageRange: "3–10", price: "$$", distanceMi: 6,
    photo: "🎨",
    blurb: "Art classes, camps and workshops for kids — drawing, painting, ceramics and mixed media in a bright, maker-friendly space.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },

  // ---------- SPORTS, MARTIAL ARTS & AFTERSCHOOL ----------
  {
    id: "modern-martial-arts", name: "Modern Martial Arts Westchester", category: "Martial Arts",
    tags: ["indoor", "active", "learning", "classes"], ring: "core",
    town: "Mount Kisco", address: "333 N Bedford Rd, Ste 228, Mount Kisco, NY 10549",
    website: "westchestermmafit.com", ageRange: "4–10", price: "$$", distanceMi: 6,
    photo: "🥋",
    blurb: "Kids' martial arts and Brazilian Jiu Jitsu focused on confidence, discipline and fun, plus birthday parties. A welcoming first dojo for many local families.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "umac-briarcliff", name: "United Martial Arts Center (UMAC)", category: "Martial Arts",
    tags: ["indoor", "active", "learning", "classes"], ring: "core",
    town: "Briarcliff Manor", address: "528 North State Rd, Briarcliff Manor, NY 10510",
    website: "umac.com", ageRange: "4–10", price: "$$", distanceMi: 13,
    photo: "🥋",
    blurb: "Martial arts programs from age 4 through adult with a strong focus on character and personal development, plus an afterschool program and camps.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Free lot",
  },
  {
    id: "elev8-afterschool", name: "Elev8 Bedford Hills", category: "Afterschool",
    tags: ["indoor", "active", "learning", "classes"], ring: "core",
    town: "Bedford Hills", address: "Bedford Hills, NY 10507",
    website: "elev8bedfordhills.com", ageRange: "4–10", price: "$$", distanceMi: 4,
    photo: "🎒",
    blurb: "An afterschool program blending sports, arts and crafts, with reliable transportation from the Katonah-Lewisboro and Bedford Central school districts.",
    changingTable: UNRATED, stroller: false, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "soccer-shots", name: "Soccer Shots Westchester", category: "Sports Program",
    tags: ["outdoor", "active", "learning", "classes"], ring: "core",
    town: "Chappaqua (multiple)", address: "Multiple locations across Westchester",
    website: "soccershots.com", ageRange: "2–8", price: "$$", distanceMi: 8,
    photo: "⚽",
    blurb: "A fun, age-appropriate intro to soccer for ages 2–8, running seasonal sessions at parks and schools across Westchester including Chappaqua, Ossining and Yorktown.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Varies", bathrooms: UNRATED, parking: "Varies",
  },
  {
    id: "sports-squirts", name: "Sports Squirts (Mount Kisco)", category: "Sports Program",
    tags: ["active", "learning", "classes"], ring: "core",
    town: "Mount Kisco (multiple)", address: "Multiple locations in the Mount Kisco area",
    website: "sportssquirts.com", ageRange: "1–8", price: "$$", distanceMi: 6,
    photo: "🏅",
    blurb: "Year-round sports classes and camps for ages 1.5–7 — soccer, tennis, T-ball, basketball and multi-sport — including Parent & Me first-sports classes.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Varies", bathrooms: UNRATED, parking: "Varies",
  },
  {
    id: "backyard-sports", name: "Backyard Sports (MVP)", category: "Sports Program",
    tags: ["active", "learning", "classes"], ring: "core",
    town: "White Plains (multiple)", address: "75 S Broadway, White Plains, NY 10601",
    website: "byardsports.com", ageRange: "4–10", price: "$$", distanceMi: 16,
    photo: "⚽",
    blurb: "Westchester's leading youth soccer and basketball programs — 30+ years of community leagues, clinics, afterschool programs and camps for K–11th grade, welcoming all ability levels.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Varies", bathrooms: UNRATED, parking: "Varies",
  },
  {
    id: "proswing-baseball", name: "ProSwing Baseball", category: "Sports Program",
    tags: ["indoor", "active", "learning", "classes", "rain-friendly"], ring: "core",
    town: "Mount Kisco", address: "Mount Kisco, NY 10549",
    website: "", ageRange: "5–10", price: "$$", distanceMi: 6,
    photo: "⚾",
    blurb: "A 9,000+ sq ft indoor baseball and softball training facility with organized programs, custom coaching, clinics and camps — swing all year, rain or shine.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Lot",
  },
  {
    id: "kids-in-sports", name: "Kids In Sports", category: "Sports Program",
    tags: ["indoor", "active", "learning", "classes", "rain-friendly"], ring: "core",
    town: "Westchester (multiple)", address: "Multiple Westchester locations",
    website: "kidsinsports.com", ageRange: "1–10", price: "$$", distanceMi: 14,
    photo: "🏀",
    blurb: "Multisport and sport-specific classes for ages 1–12 — baseball, basketball, flag football, floor hockey, lacrosse, soccer and volleyball, starting with parent-and-me.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Varies",
  },
  {
    id: "us-sports-institute", name: "US Sports Institute", category: "Sports Program",
    tags: ["outdoor", "active", "learning", "classes"], ring: "core",
    town: "Westchester (multiple)", address: "Parks & schools across Westchester",
    website: "ussportsinstitute.com", ageRange: "2–10", price: "$$", distanceMi: 10,
    photo: "🎾",
    blurb: "Seasonal classes, clinics and camps across the county in soccer, tennis, basketball, lacrosse, golf, T-ball, flag football, track & field and multi-sport — for ages 2 and up.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Varies", bathrooms: UNRATED, parking: "Varies",
  },
  {
    id: "mtkisco-rec", name: "Mount Kisco Recreation", category: "Sports Program",
    tags: ["active", "learning", "classes", "water"], ring: "core",
    town: "Mount Kisco", address: "104 Main St, Mount Kisco, NY 10549",
    website: "mountkiscony.gov", ageRange: "3–10", price: "$", distanceMi: 6,
    photo: "🏊",
    blurb: "The town rec department's youth programs — a youth basketball league, swim programs and a swim & dive team, plus seasonal Pre-K and youth activities. The budget-friendly option; register via CommunityPass.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Varies", bathrooms: UNRATED, parking: "Municipal lots",
  },
  // ---------- PUBLIC POOLS ----------
  {
    id: "saxon-woods-pool", name: "Saxon Woods Pool", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "White Plains", address: "1800 Mamaroneck Ave, White Plains, NY 10605",
    website: "parks.westchestercountyny.gov", ageRange: "0–10", price: "$", distanceMi: 15,
    photo: "🏖️",
    blurb: "The county's largest pool — an aquatic play area with a water playground and slides for little non-swimmers, a snack bar, picnic areas, and a rebuilt playground plus mini-golf just outside. Summer season; Westchester residents (Park Pass gets the best rates).",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Lot (fee at picnic area)",
  },
  {
    id: "tibbetts-brook-pool", name: "The Brook at Tibbetts Brook Park", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "Yonkers", address: "Midland Ave, Yonkers, NY 10704",
    website: "parks.westchestercountyny.gov", ageRange: "0–10", price: "$", distanceMi: 24,
    photo: "🛟",
    blurb: "A full aquatic complex: spray playground, two water slides, in-pool basketball and volleyball, lap lanes and the signature lazy river — plus playgrounds and mini golf in the park. Summer season; Westchester residents.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Lot (fee)",
  },
  {
    id: "willsons-waves", name: "Willson's Waves (Willson's Woods Park)", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "Mount Vernon", address: "Willson's Woods Park, Mount Vernon, NY 10552",
    website: "parks.westchestercountyny.gov", ageRange: "0–10", price: "$", distanceMi: 26,
    photo: "🌊",
    blurb: "The wave pool! 3-foot waves, zero-depth entry that's perfect for tots, 18-foot water slides and a spray deck with 57 jets. Four water areas for every age. Summer season; Westchester residents.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  {
    id: "sprain-ridge-pool", name: "Sprain Ridge Pool", category: "Pool",
    tags: ["water", "outdoor", "active", "trails"], ring: "core",
    town: "Yonkers", address: "Jackson Ave, Yonkers, NY 10701",
    website: "parks.westchestercountyny.gov", ageRange: "0–10", price: "$", distanceMi: 22,
    photo: "💦",
    blurb: "The county's newest pool complex after a full renovation — main lap pool, activity pool and aquatic playground, with two picnic areas and hiking trails in the surrounding park. Summer season; Westchester residents; free parking.",
    changingTable: true, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  {
    id: "lewisboro-pool", name: "Lewisboro Town Park Pool", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "South Salem", address: "1 Town Park Rd, South Salem, NY 10590",
    website: "lewisborony.gov", ageRange: "0–10", price: "$", distanceMi: 7,
    photo: "🏊",
    blurb: "The closest town pool to Katonah — Lewisboro's summer pool runs weekday afternoons (noon–7:30) and weekends (11–7). A low-key local swim with town-park playground nearby. Seasonal; check town site for passes.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  {
    id: "katonah-memorial-pool", name: "Katonah Memorial Park Pool", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "Katonah", address: "Top of North St, Katonah, NY 10536",
    website: "bedfordny.gov", ageRange: "0–10", price: "$", distanceMi: 1,
    photo: "🏊",
    blurb: "Katonah's hometown summer pool, up on the hill — a baby pool plus main pool, a new pool house with locker rooms, snack bar, ping pong, and town lounge chairs and umbrellas so there's nothing to lug. Swim lessons and a kids' swim & dive team too. Memorial Day–Labor Day; Town of Bedford pool ID or day pass.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  {
    id: "bedford-hills-pool", name: "Bedford Hills Memorial Park Pool", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "Bedford Hills", address: "60 Haines Rd, Bedford Hills, NY 10507",
    website: "bedfordny.gov", ageRange: "0–10", price: "$", distanceMi: 3,
    photo: "💧",
    blurb: "The Bedford Hills hamlet pool at Memorial Park — with tennis and basketball courts, ballfields, picnic areas and a playground all in the same park for a full summer day. Memorial Day–Labor Day; town pool ID valid at all three Bedford pools.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  {
    id: "bedford-village-pool", name: "Bedford Village Memorial Park Pool", category: "Pool",
    tags: ["water", "outdoor", "active"], ring: "core",
    town: "Bedford", address: "65 Greenwich Rd, Bedford, NY 10506",
    website: "bedfordny.gov", ageRange: "0–10", price: "$", distanceMi: 4,
    photo: "🌊",
    blurb: "The Bedford Village hamlet pool — same Memorial Park recipe: pool plus playground, tennis, platform tennis, fields and picnic areas. Memorial Day–Labor Day; one Bedford pool membership covers all three hamlet pools.",
    changingTable: UNRATED, stroller: true, food: UNRATED, crowd: UNRATED, shade: "Some", bathrooms: true, parking: "Free lot",
  },
  // ---------- FARMERS MARKETS ----------
  {
    id: "pleasantville-market", name: "Pleasantville Farmers Market", category: "Farmers Market",
    tags: ["outdoor", "food", "free", "learning"], ring: "core",
    town: "Pleasantville", address: "Memorial Plaza, 10 Memorial Plaza, Pleasantville, NY 10570",
    website: "pleasantvillefarmersmarket.org", ageRange: "All ages", price: "Free", distanceMi: 10,
    photo: "🥕",
    blurb: "The county's largest year-round farmers market and a repeat \"Best of Westchester\" winner — dozens of vendors plus weekly live music and kids' events. Saturday mornings, 8:30–1.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Lot + street",
  },
  {
    id: "chappaqua-market", name: "Chappaqua Farmers Market", category: "Farmers Market",
    tags: ["outdoor", "food", "free", "learning"], ring: "core",
    town: "Chappaqua", address: "Chappaqua Metro-North Station, Allen Pl, Chappaqua, NY 10514",
    website: "chappaquafarmersmarket.org", ageRange: "All ages", price: "Free", distanceMi: 8,
    photo: "🍎",
    blurb: "40+ vendors at the train station every Saturday morning (8:30–1), with local musicians and educational activities for kids. Seasonal, roughly May through mid-December.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Station lot",
  },
  {
    id: "mtkisco-market", name: "Mount Kisco Farmers Market", category: "Farmers Market",
    tags: ["outdoor", "food", "free"], ring: "core",
    town: "Mount Kisco", address: "S Moger Ave parking lot, Mount Kisco, NY 10549",
    website: "", ageRange: "All ages", price: "Free", distanceMi: 6,
    photo: "🌽",
    blurb: "Sunday-morning market on Moger Ave with local producers, live entertainment, family activities and wellness events. Seasonal, roughly May through November.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Municipal lot",
  },
  {
    id: "tash-market", name: "The TaSH (Tarrytown & Sleepy Hollow Market)", category: "Farmers Market",
    tags: ["outdoor", "food", "free", "learning"], ring: "core",
    town: "Tarrytown", address: "Patriots Park, US-9, Tarrytown, NY 10591",
    website: "tashfarmersmarket.org", ageRange: "All ages", price: "Free", distanceMi: 17,
    photo: "🎶",
    blurb: "A beloved Saturday market in Patriots Park with live music, cooking demos, art projects and kids' activities alongside the produce. Memorial Day through Thanksgiving; free parking at John Paulding School.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "Some", bathrooms: UNRATED, parking: "Free lot nearby",
  },
  {
    id: "roselle-park", name: "Roselle Park and Playground", category: "Playground",
    tags: ["outdoor", "free", "active"], ring: "core",
    town: "Pleasantville", address: "52 Weskora Ave, Pleasantville, NY 10570",
    website: "", ageRange: "0–10", price: "Free", distanceMi: 10,
    photo: "🛝",
    blurb: "A neighborhood classic, freshly renovated in 2025 — multiple climbing structures with rock walls, a toddler structure, shade canopies, bucket and bench swings (plus a boat swing), and the beloved wooden house still standing. Ball fields, tree shade, and a friendly sandbox tradition where neighbors leave toys to share.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "Good (trees + canopies)", bathrooms: UNRATED, parking: "Free street",
  },
  // ---------- DAYCARE & PRESCHOOL ----------
  {
    id: "katonah-playcare", name: "Katonah Playcare Early Learning Center", category: "Daycare & Preschool",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Katonah", address: "Katonah, NY 10536",
    website: "katonahplaycare.com", ageRange: "2–5", price: "$$", distanceMi: 1,
    photo: "🎒",
    blurb: "An early learning center with a child-centered curriculum for Twos, Threes and Fours. Tours welcome year-round — a well-known first school for Katonah families.",
    changingTable: true, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Lot",
  },
  {
    id: "katonah-village-kids", name: "Katonah Village Kids", category: "Daycare & Preschool",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Katonah", address: "Katonah, NY 10536",
    website: "katonahvillagekids.com", ageRange: "2–5", price: "$$", distanceMi: 1,
    photo: "🧸",
    blurb: "A play-based preschool built around children's natural love of play, fostering social, emotional and intellectual growth. Book a tour to visit.",
    changingTable: true, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Village lot",
  },
  {
    id: "little-feet-katonah", name: "Little Feet Childcare Center", category: "Daycare & Preschool",
    tags: ["indoor", "learning"], ring: "core",
    town: "Katonah", address: "131 Bedford Rd, Katonah, NY 10536",
    website: "littlefeetchildcarecenterkatonahny.com", ageRange: "0–5", price: "$$", distanceMi: 1,
    photo: "👣",
    blurb: "Full childcare plus a preschool group that preps children for pre-K — pencil skills, crafts and plenty of creative play. Phone: 914-401-9230.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Lot",
  },
  {
    id: "mkccc", name: "Mount Kisco Child Care Center", category: "Daycare & Preschool",
    tags: ["indoor", "learning", "classes"], ring: "core",
    town: "Mount Kisco", address: "Mount Kisco, NY 10549",
    website: "mkccc.org", ageRange: "0–10", price: "$$", distanceMi: 6,
    photo: "🌱",
    blurb: "Child care and early education from 3 months to 11 years, including preschool and a school-age program with homework help. Known for 'Feed Me Fresh' — a seed-to-table nutrition program with cooking classes.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Lot",
  },
  {
    id: "kids-world-preschool", name: "A Kid's World Preschool & Daycare", category: "Daycare & Preschool",
    tags: ["indoor", "learning"], ring: "core",
    town: "Mount Kisco", address: "325 West Patent Rd, Mount Kisco, NY 10549",
    website: "akidsworldpreschool.com", ageRange: "0–5", price: "$$", distanceMi: 6,
    photo: "🌍",
    blurb: "A licensed bilingual preschool and daycare serving infants, toddlers and preschoolers in the Bedford school district. Phone: 914-244-8504.",
    changingTable: true, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Lot",
  },
  {
    id: "landmark-preschool", name: "Landmark Preschool", category: "Daycare & Preschool",
    tags: ["indoor", "learning"], ring: "core",
    town: "Bedford", address: "44 Village Green, Bedford, NY 10506",
    website: "landmarkpreschool.org", ageRange: "2–5", price: "$$", distanceMi: 4,
    photo: "🏫",
    blurb: "A village preschool on Bedford's historic green, long a first-school choice for local families. Phone: 914-393-2293.",
    changingTable: true, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Village green",
  },
  // ---------- MORE SHOPPING ----------
  {
    id: "reading-room-katonah", name: "The Reading Room", category: "Bookstore",
    tags: ["indoor", "shopping", "rain-friendly", "learning"], ring: "core",
    town: "Katonah", address: "Katonah, NY 10536",
    website: "", ageRange: "All ages", price: "$$", distanceMi: 1,
    photo: "📖",
    blurb: "A cozy bookstore and coffee shop steps from the Katonah Metro-North station, with book clubs and events. Grab a picture book and a hot chocolate — the easiest rainy-morning outing in the village.",
    changingTable: UNRATED, stroller: true, food: true, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Village lot",
  },
  {
    id: "scattered-books", name: "Scattered Books", category: "Bookstore",
    tags: ["indoor", "shopping", "rain-friendly", "learning"], ring: "core",
    town: "Chappaqua", address: "Chappaqua, NY 10514",
    website: "scatteredbooks.com", ageRange: "All ages", price: "$$", distanceMi: 8,
    photo: "📚",
    blurb: "A family-owned bookshop set inside an antique house — books for children and grown-ups, gifts, and author signings. Charming enough that browsing feels like an activity.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street",
  },
  {
    id: "hip-kid", name: "hip kid", category: "Store",
    tags: ["indoor", "shopping", "rain-friendly"], ring: "core",
    town: "Chappaqua", address: "77 S Greeley Ave, Chappaqua, NY 10514",
    website: "", ageRange: "0–10", price: "$$$", distanceMi: 8,
    photo: "👕",
    blurb: "One of the area's coolest children's clothing shops — infants through teens, plus the toys, accessories and gifts kids actually want.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street + lot",
  },
  {
    id: "briarcliff-toyshop", name: "Briarcliff Toyshop", category: "Toy Store",
    tags: ["indoor", "shopping", "rain-friendly"], ring: "core",
    town: "Briarcliff Manor", address: "Briarcliff Manor, NY 10510",
    website: "", ageRange: "0–10", price: "$$", distanceMi: 13,
    photo: "🧸",
    blurb: "A carefully curated independent toy shop mixing new releases with classic toys — the kind of place staff can pick the right gift for any age.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street",
  },
  {
    id: "star-spangled-carousel", name: "Star Spangled Carousel", category: "Store",
    tags: ["indoor", "shopping", "rain-friendly"], ring: "core",
    town: "Armonk", address: "Armonk, NY 10504",
    website: "", ageRange: "0–10", price: "$$$", distanceMi: 9,
    photo: "🎠",
    blurb: "Three floors of a historic home filled with high-quality children's clothing, including exclusive European lines. A special-occasion and gift destination for decades.",
    changingTable: UNRATED, stroller: false, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street",
  },
  {
    id: "lego-store-wp", name: "The LEGO Store Westchester", category: "Toy Store",
    tags: ["indoor", "shopping", "rain-friendly"], ring: "core",
    town: "White Plains", address: "125 Westchester Ave, White Plains, NY 10601",
    website: "lego.com", ageRange: "3–10", price: "$$", distanceMi: 16,
    photo: "🧱",
    blurb: "The official LEGO store at The Westchester — sets, the pick-a-brick wall, and minifigure building. An easy rainy-day win, especially paired with the mall's other kid stops.",
    changingTable: true, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Mall garage",
  },
  {
    id: "build-a-bear-wp", name: "Build-A-Bear Workshop", category: "Toy Store",
    tags: ["indoor", "shopping", "rain-friendly", "active"], ring: "core",
    town: "White Plains", address: "125 Westchester Ave, White Plains, NY 10601",
    website: "buildabear.com", ageRange: "3–10", price: "$$", distanceMi: 16,
    photo: "🐻",
    blurb: "Less a store than an activity — kids stuff, dress and name their own bear start to finish. A reliable birthday treat, and it takes a good hour.",
    changingTable: true, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: true, parking: "Mall garage",
  },
  {
    id: "millers-toy-store", name: "Miller's Toy Store", category: "Toy Store",
    tags: ["indoor", "shopping", "rain-friendly"], ring: "core",
    town: "Mamaroneck", address: "335 Mamaroneck Ave, Mamaroneck, NY 10543",
    website: "", ageRange: "0–10", price: "$$", distanceMi: 22,
    photo: "🚲",
    blurb: "A local institution: toys, books and bikes plus kids' clothes and shoes from infant to tween. Known for genuinely helpful service and a loyalty program.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street",
  },
  {
    id: "bronx-river-books", name: "Bronx River Books", category: "Bookstore",
    tags: ["indoor", "shopping", "rain-friendly", "learning"], ring: "core",
    town: "Scarsdale", address: "Scarsdale, NY 10583",
    website: "bronxriverbooks.com", ageRange: "All ages", price: "$$", distanceMi: 18,
    photo: "📗",
    blurb: "Over 14,000 titles including a deep children's section, plus puzzles, board games, coloring and activity books. A great gift stop.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Village lot",
  },
  {
    id: "womrath-bookshop", name: "Womrath Bookshop", category: "Bookstore",
    tags: ["indoor", "shopping", "rain-friendly", "learning"], ring: "core",
    town: "Bronxville", address: "76 Pondfield Rd, Bronxville, NY 10708",
    website: "", ageRange: "All ages", price: "$$", distanceMi: 21,
    photo: "📕",
    blurb: "A Bronxville mainstay since 1938 — a mom-and-pop shop with carefully curated children's books, toys and gifts, and a loyal local following.",
    changingTable: UNRATED, stroller: true, food: false, crowd: UNRATED, shade: "N/A (indoor)", bathrooms: UNRATED, parking: "Street",
  },
];


const INTERESTS = [
  { key: "animals", label: "Animals", icon: "🐾" },
  { key: "water", label: "Water play", icon: "💦" },
  { key: "nature", label: "Nature & hikes", icon: "🌲" },
  { key: "active", label: "Running around", icon: "🏃" },
  { key: "food", label: "Treats & food", icon: "🍦" },
  { key: "learning", label: "Learning", icon: "📚" },
];

// mock weather signal. rainRiskAfter = hour (24h) when rain may start; null = clear all day.
const WEATHER = { condition: "sunny", tempF: 78, rainRiskAfter: null, live: false, tomorrow: null };

async function fetchLiveWeather() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=41.2587&longitude=-73.6854" +
      "&hourly=precipitation_probability,weather_code&daily=temperature_2m_max,weather_code,precipitation_probability_max" +
      "&temperature_unit=fahrenheit&forecast_days=2&timezone=auto";
    const r = await fetch(url);
    const d = await r.json();
    const probs = (d.hourly && d.hourly.precipitation_probability) || [];
    const codes = (d.hourly && d.hourly.weather_code) || [];
    const nowH = new Date().getHours();
    let rainAfter = null;
    for (let i = nowH; i < probs.length; i++) {
      if (probs[i] >= 45) { rainAfter = i; break; }
    }
    let maxCode = 0;
    for (let i = nowH; i < Math.min(codes.length, nowH + 12); i++) maxCode = Math.max(maxCode, codes[i] || 0);
    const t = d.daily && d.daily.temperature_2m_max && d.daily.temperature_2m_max[0];
    if (typeof t === "number") WEATHER.tempF = Math.round(t);
    WEATHER.rainRiskAfter = rainAfter;
    WEATHER.condition = maxCode >= 51 ? "rainy" : maxCode >= 45 ? "foggy" : maxCode >= 1 ? "cloudy" : "sunny";
    WEATHER.live = true;
    if (d.daily && d.daily.temperature_2m_max && d.daily.temperature_2m_max.length > 1) {
      const tomCode = d.daily.weather_code ? d.daily.weather_code[1] : 0;
      const tomRainChance = d.daily.precipitation_probability_max ? d.daily.precipitation_probability_max[1] : 0;
      WEATHER.tomorrow = {
        tempF: Math.round(d.daily.temperature_2m_max[1]),
        rainy: tomCode >= 51 || tomRainChance >= 50,
        greatDay: tomCode < 2 && d.daily.temperature_2m_max[1] >= 65 && d.daily.temperature_2m_max[1] <= 85,
      };
    }
    return true;
  } catch (e) { return false; }
}

// ---- School calendar (manually curated starter set — update yearly) ----
// Source: each district's published 2025–2026 calendar, checked July 2026.
// Add more districts here as needed; dates are YYYY-MM-DD, inclusive ranges.
const SCHOOL_DISTRICTS = [
  {
    id: "bedford", name: "Bedford Central School District",
    noSchool: [
      ["2025-12-24", "2026-01-02"], // Winter break
      ["2026-03-30", "2026-04-03"], // Spring break
      ["2026-06-27", "2099-12-31"], // Summer (last day June 26, 2026)
    ],
  },
  {
    id: "chappaqua", name: "Chappaqua Central School District",
    noSchool: [
      ["2025-12-22", "2026-01-02"], // Winter break
      ["2026-02-16", "2026-02-20"], // February break
      ["2026-03-30", "2026-04-03"], // Spring break
      ["2026-06-27", "2099-12-31"], // Summer (last day June 26, 2026)
    ],
  },
  {
    id: "katonah-lewisboro", name: "Katonah-Lewisboro School District",
    noSchool: [
      ["2025-11-27", "2025-11-28"], // Thanksgiving recess
      ["2025-12-22", "2026-01-02"], // Holiday recess
      ["2026-02-16", "2026-02-20"], // Winter recess
      ["2026-03-30", "2026-04-03"], // Spring recess
      ["2026-06-27", "2099-12-31"], // Summer (last day June 26, 2026)
    ],
  },
];
function isNoSchoolDay(districtId, dateStr) {
  const d = SCHOOL_DISTRICTS.find((x) => x.id === districtId);
  if (!d) return false;
  return d.noSchool.some(([start, end]) => dateStr >= start && dateStr <= end);
}
// Estimated opening hours per place (24h decimal). NOTE: these are approximate
// placeholders until real hours come from a live source. Format: [open, close].
const HOURS = {
  "muscoot-farm": [9, 16.5], "katonah-library": [10, 18], "john-jay": [7, 19],
  "caramoor": [10, 16], "katonah-museum": [12, 17], "bedford-hills-library": [10, 18],
  "rockin-jump": [10, 20], "mtkisco-library": [10, 18], "ward-pound-ridge": [8, 18],
  "westmoreland": [9, 17], "outhouse-orchards": [9, 17], "stuarts-farm": [9, 17],
  "king-kone": [12, 21], "chappaqua-library": [10, 18], "stone-barns": [10, 16],
  "teatown": [9, 17], "kensico-dam": [7, 19], "saxon-woods": [8, 18],
  "greenburgh-nature": [9.5, 16.5], "westchester-childrens-museum": [10, 17],
  "playland": [11, 21], "maritime-aquarium": [10, 17], "stepping-stones": [10, 17],
  "hudson-river-museum": [12, 17], "legoland": [10, 19], "bronx-zoo": [10, 16.5],
  "blue-dolphin": [7, 22], "mtkisco-diner": [6, 22], "belizzie": [11, 21],
  "little-kebab": [11, 21.5], "taco-street": [11.5, 21], "table-nine": [11, 21], "bedford-hills-diner": [7, 21],
  "katonah-memorial-park": [8, 20], "leonard-park": [8, 20],
  "g-willikers": [10, 18], "all-together-now": [10, 18],
  "barnes-noble": [9, 21], "target-mtkisco": [8, 22],
  "rockefeller-park": [8, 18], "nannahagan-park": [8, 20], "jacob-burns": [11, 21],
  "lombardi-park": [8, 20], "mianus-gorge": [8.5, 17], "bedford-village-park": [8, 20],
  "fdr-state-park": [8, 19], "reis-park": [8, 20],
  "pierson-park": [8, 20], "kingsland-point": [8, 20], "philipsburg-manor": [10, 17],
  "sunnyside": [10, 17], "lighthouse-ice-cream": [12, 22], "blue-pig": [13, 22],
  "curious-on-hudson": [10, 18], "louis-engel-park": [8, 20], "van-cortlandt-manor": [10, 17],
  "rye-nature-center": [9, 17], "tibbetts-brook": [8, 20], "untermyer": [9, 17],
  "sky-zone-nr": [10, 20], "glen-island": [8, 20], "harbor-island": [8, 20],
  "world-cup-gym": [9, 21],
  "jodis-gym": [9, 19], "kidville": [9, 18], "armonk-sports": [8, 21],
  "kids-u": [9, 18], "amadeus-music": [12, 20], "weebop-music": [9, 17],
  "mike-risko-music": [12, 20], "logrea-dance": [13, 21], "breaking-ground-dance": [13, 21],
  "amaze-pottery": [11, 18], "katonah-art-center": [10, 18],
  "modern-martial-arts": [9, 21], "umac-briarcliff": [10, 21], "elev8-afterschool": [15, 18],
  "soccer-shots": [9, 18], "sports-squirts": [9, 18],
  "backyard-sports": [9, 19], "proswing-baseball": [10, 21], "kids-in-sports": [9, 18],
  "us-sports-institute": [9, 18], "mtkisco-rec": [9, 17],
  "saxon-woods-pool": [11, 18], "tibbetts-brook-pool": [11, 18], "willsons-waves": [11, 18],
  "sprain-ridge-pool": [11, 18], "lewisboro-pool": [11, 19],
  "katonah-memorial-pool": [11, 19], "bedford-hills-pool": [11, 19], "bedford-village-pool": [11, 19],
  "pleasantville-market": [8, 13], "chappaqua-market": [8, 13], "mtkisco-market": [10, 15], "tash-market": [8, 14], "roselle-park": [8, 20],
  "katonah-playcare": [7, 18], "katonah-village-kids": [8, 15], "little-feet-katonah": [7, 18],
  "mkccc": [7, 18], "kids-world-preschool": [7, 18], "landmark-preschool": [8, 15],
  "reading-room-katonah": [8, 18], "scattered-books": [10, 18], "hip-kid": [10, 18],
  "briarcliff-toyshop": [10, 18], "star-spangled-carousel": [10, 17], "lego-store-wp": [10, 20],
  "build-a-bear-wp": [10, 20], "millers-toy-store": [10, 18], "bronx-river-books": [10, 18],
  "womrath-bookshop": [10, 18],
};

function placeHours(place) {
  return HOURS[place.id] || null;
}

// Kid-friendly perks (crayons, kids' menu, play areas, etc.). Curated — verify on the day.
const KID_PERKS = {
  "blue-dolphin": ["High chairs", "Kids' menu", "Crayons & coloring"],
  "mtkisco-diner": ["High chairs", "Kids' menu", "Crayons", "Big milkshakes"],
  "belizzie": ["High chairs", "Kids' menu", "Arcade games", "Toddler play nook", "Game tokens"],
  "little-kebab": ["High chairs", "Fast service"],
  "taco-street": ["High chairs", "Child favorites", "Room to move around"],
  "table-nine": ["High chairs", "Kids' menu", "Picky-eater & GF friendly"],
  "barnes-noble": ["Kids' storytimes", "Big kids' book & toy section", "Cafe"],
  "bedford-hills-diner": ["High chairs", "Kids' menu", "Tuesday character night"],
  "reading-room-katonah": ["Picture book nook", "Cafe with hot chocolate", "Story events"],
  "build-a-bear-wp": ["Build your own bear", "Birthday parties", "Takes about an hour"],
  "lego-store-wp": ["Pick-a-brick wall", "Build a minifigure", "Play tables"],
  "millers-toy-store": ["Toys, books & bikes", "Kids' shoes", "Loyalty program"],
};
function placePerks(place) {
  return KID_PERKS[place.id] || [];
}

// Which places are class/registration-based (no drop-ins) and whether a free trial is known.
const CLASS_INFO = {
  "world-cup-gym": { classBased: true, freeTrial: true },
  "jodis-gym": { classBased: true, freeTrial: true },
  "kidville": { classBased: true, freeTrial: true },
  "armonk-sports": { classBased: true, freeTrial: null },
  "kids-u": { classBased: true, freeTrial: null },
  "amadeus-music": { classBased: true, freeTrial: null },
  "weebop-music": { classBased: true, freeTrial: null },
  "mike-risko-music": { classBased: true, freeTrial: null },
  "logrea-dance": { classBased: true, freeTrial: null },
  "breaking-ground-dance": { classBased: true, freeTrial: null },
  "katonah-art-center": { classBased: true, freeTrial: null },
  "amaze-pottery": { classBased: false, freeTrial: null },
  "modern-martial-arts": { classBased: true, freeTrial: true },
  "umac-briarcliff": { classBased: true, freeTrial: true },
  "elev8-afterschool": { classBased: true, freeTrial: null },
  "soccer-shots": { classBased: true, freeTrial: true },
  "sports-squirts": { classBased: true, freeTrial: null },
  "backyard-sports": { classBased: true, freeTrial: null },
  "proswing-baseball": { classBased: true, freeTrial: null },
  "kids-in-sports": { classBased: true, freeTrial: null },
  "us-sports-institute": { classBased: true, freeTrial: null },
  "mtkisco-rec": { classBased: true, freeTrial: null },
  "katonah-playcare": { classBased: true, freeTrial: null },
  "katonah-village-kids": { classBased: true, freeTrial: null },
  "little-feet-katonah": { classBased: true, freeTrial: null },
  "mkccc": { classBased: true, freeTrial: null },
  "kids-world-preschool": { classBased: true, freeTrial: null },
  "landmark-preschool": { classBased: true, freeTrial: null },
};
function classInfo(place) { return CLASS_INFO[place.id] || null; }

// Cuisine and dietary notes for food places. gf/veg/vegan: true = confirmed options,
// null = ask (we don't guess). Always call ahead for serious allergies.
const FOOD_INFO = {
  "blue-dolphin": { cuisine: "Italian", dishes: "Pasta, pizza, chicken parm, seafood, garlic bread", gf: true, veg: true, vegan: null, note: "Gluten-free pasta available" },
  "mtkisco-diner": { cuisine: "American diner", dishes: "Burgers, hot dogs, grilled cheese, chicken fingers, pancakes, milkshakes", gf: null, veg: true, vegan: null, note: "Huge menu — easy for picky eaters" },
  "belizzie": { cuisine: "Pizza & Italian", dishes: "Pizza by the slice, garlic knots, pasta, gelato", gf: true, veg: true, vegan: null, note: "Gluten-free crust available" },
  "little-kebab": { cuisine: "Turkish & Mediterranean", dishes: "Chicken & lamb kebabs, rice bowls, hummus, pita, salads, fries", gf: true, veg: true, vegan: true, note: "Naturally lots of GF & vegan options" },
  "taco-street": { cuisine: "Mexican", dishes: "Tacos, quesadillas, burritos, rice bowls, chips & guac", gf: true, veg: true, vegan: true, note: "Corn tortillas are gluten-free" },
  "table-nine": { cuisine: "American bistro", dishes: "Burgers, sandwiches, salads, pasta, seasonal plates", gf: null, veg: true, vegan: null, note: "Ask about the day's options" },
  "bedford-hills-diner": { cuisine: "American diner", dishes: "Burgers, hot dogs, grilled cheese, chicken fingers, eggs & pancakes all day", gf: null, veg: true, vegan: null, note: "Kids' menu; call for the Tuesday event" },
  "king-kone": { cuisine: "Ice cream", dishes: "Soft serve, cones, sundaes, milkshakes, hot dogs, fries", gf: null, veg: true, vegan: null, note: "Ask about dairy-free flavors" },
  "lighthouse-ice-cream": { cuisine: "Ice cream", dishes: "Hard & soft serve, cones, sundaes, shakes", gf: null, veg: true, vegan: null, note: "Ask about dairy-free flavors" },
  "blue-pig": { cuisine: "Ice cream", dishes: "Small-batch scoops, cones, rotating local flavors", gf: null, veg: true, vegan: null, note: "Rotating flavors — ask what's dairy-free" },
};
function foodInfo(place) { return FOOD_INFO[place.id] || null; }

// One consistent icon per category — used on map pins and category headers.
const CATEGORY_ICON = {
  "Park": "🌳", "Playground": "🛝", "Farm": "🐐", "Trail": "🥾", "Nature Center": "🦉",
  "Pool": "🏊", "Beach": "🏖️", "Library": "📚", "Museum": "🏛️", "Historic Site": "🏛️",
  "Restaurant": "🍽️", "Ice Cream": "🍦", "Farmers Market": "🥕",
  "Toy Store": "🧸", "Store": "🛍️", "Gym & Classes": "🤸", "Martial Arts": "🥋",
  "Dance Classes": "🩰", "Music Classes": "🎵", "Art Studio": "🎨",
  "Sports Program": "⚽", "Afterschool": "🎒", "Kids' Studio": "🧩",
  "Daycare & Preschool": "🏫", "Indoor Play": "🎪", "Theater": "🎭", "Aquarium": "🐠",
  "Indoor Playground": "🎪", "Amusement Park": "🎡", "Zoo": "🦁", "Gardens": "🌷",
  "Gardens & Arts": "🌷", "Children's Museum": "🏛️", "Cinema": "🎬", "Bookstore": "📖",
};
function categoryIcon(place) { return CATEGORY_ICON[place.category] || place.photo || "📍"; }

// Every place belongs to exactly ONE group — no place appears twice in the list.
const PRIMARY_GROUPS = [
  { k: "play", l: "Play & Outdoors", cats: ["Playground", "Park", "Pool", "Trail", "Beach", "Farm", "Nature Center", "Indoor Play", "Indoor Playground", "Amusement Park", "Zoo", "Gardens", "Gardens & Arts"] },
  { k: "eat", l: "Eat & Treats", cats: ["Restaurant", "Ice Cream", "Farmers Market"] },
  { k: "learn", l: "Learn & Explore", cats: ["Library", "Museum", "Historic Site", "Theater", "Aquarium", "Children's Museum", "Cinema"] },
  { k: "classes", l: "Classes & Care", cats: ["Gym & Classes", "Martial Arts", "Dance Classes", "Music Classes", "Art Studio", "Sports Program", "Afterschool", "Kids' Studio", "Daycare & Preschool"] },
  { k: "shop", l: "Shopping", cats: ["Toy Store", "Store", "Bookstore"] },
];
function primaryGroup(place) {
  for (const g of PRIMARY_GROUPS) if (g.cats.includes(place.category)) return g.k;
  return "play"; // sensible default so nothing ever disappears
}

/* ---------------------------------------------------------
   GOOGLE PLACES SEARCH (fills gaps in our curated list)
   Cost note: we only ask for Pro-tier fields (name, address,
   location, types) and only when our own results are thin.
--------------------------------------------------------- */
const GMAPS_LIBRARIES = ["places"];

// Map Google's place types onto our categories so icons/labels stay consistent.
const GOOGLE_TYPE_MAP = [
  [["amusement_park", "water_park"], "Indoor Play"],
  [["aquarium"], "Aquarium"],
  [["museum", "art_gallery"], "Museum"],
  [["library"], "Library"],
  [["park", "national_park"], "Park"],
  [["playground"], "Playground"],
  [["zoo"], "Farm"],
  [["swimming_pool"], "Pool"],
  [["restaurant", "cafe", "bakery", "meal_takeaway", "diner", "pizza_restaurant"], "Restaurant"],
  [["ice_cream_shop", "dessert_shop"], "Ice Cream"],
  [["book_store", "toy_store", "clothing_store", "store", "shopping_mall"], "Store"],
  [["gym", "fitness_center", "sports_complex", "sports_club"], "Gym & Classes"],
  [["preschool", "school", "primary_school"], "Daycare & Preschool"],
  [["movie_theater", "performing_arts_theater"], "Theater"],
  [["tourist_attraction", "historical_landmark"], "Historic Site"],
];
function googleCategory(types = []) {
  for (const [keys, cat] of GOOGLE_TYPE_MAP) {
    if (types.some((t) => keys.includes(t))) return cat;
  }
  return "Place";
}

// Turn a Google result into the shape our UI understands.
function googleToPlace(g) {
  const addr = g.formattedAddress || "";
  const parts = addr.split(",");
  const town = parts.length >= 2 ? parts[parts.length - 3]?.trim() || parts[0].trim() : addr;
  const cat = googleCategory(g.types || []);
  return {
    id: "g_" + (g.id || g.place_id || Math.random().toString(36).slice(2)),
    name: typeof g.displayName === "string" ? g.displayName : g.displayName?.text || g.name || "Place",
    category: cat,
    town: town || "Nearby",
    address: addr,
    tags: [],
    photo: CATEGORY_ICON[cat] || "📍",
    fromGoogle: true,
    coords: g.location ? { lat: typeof g.location.lat === "function" ? g.location.lat() : g.location.lat,
                           lng: typeof g.location.lng === "function" ? g.location.lng() : g.location.lng } : null,
  };
}

// Debounced Google text search. Returns [] until Maps + Places are ready.
function useGoogleSearch(query, curatedCount) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const q = (query || "").trim();
    // Only reach for Google when our own list is thin — this keeps calls (and cost) low.
    if (q.length < 3 || curatedCount >= 3) { setResults([]); setSearching(false); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const g = window.google;
        if (!g?.maps?.places?.Place?.searchByText) { setResults([]); return; }
        setSearching(true);
        const { places } = await g.maps.places.Place.searchByText({
          textQuery: q + " Westchester County NY",
          fields: ["id", "displayName", "formattedAddress", "location", "types"],
          maxResultCount: 6,
          locationBias: { center: { lat: 41.2587, lng: -73.6854 }, radius: 40000 },
        });
        if (!cancelled) setResults((places || []).map(googleToPlace));
      } catch (e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, curatedCount]);
  return { results, searching };
}

function GooglePlaceSheet({ place, onClose }) {
  if (!place) return null;
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.name + " " + place.address);
  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-6 pb-8" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>{place.photo}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{place.name}</p>
            <p className="text-[13px] text-[#8A8474]">{place.category} · {place.town}</p>
          </div>
        </div>
        {place.address && <p className="text-[13px] text-[#5C5648] mt-3">{place.address}</p>}
        <div className="rounded-2xl p-3.5 mt-4" style={{ backgroundColor: "#F3F5F9" }}>
          <p className="text-[12.5px] leading-snug" style={{ color: "#5B6B8C" }}>
            Found on Google Maps — not yet parent-verified, so we don't have bathroom, stroller or kid-perk notes for it.
          </p>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
          Open in Google Maps
        </a>
        <p className="text-[11px] text-[#B8B0A0] text-center mt-3">Love this spot? Tell us and we'll add it properly, with the details parents actually need.</p>
      </div>
    </div>
  );
}


// Which farmers markets have prepared-food vendors (not just produce).
const MARKET_FOOD = {
  "pleasantville-market": { vendors: true, note: "Prepared food & baked goods vendors — you can eat there" },
  "chappaqua-market": { vendors: true, note: "Bakery & prepared-food vendors on site" },
  "mtkisco-market": { vendors: null, note: "Mostly produce — call ahead if you're counting on lunch" },
  "tash-market": { vendors: true, note: "Prepared food, coffee & cooking demos" },
  "katonah-market-place": { vendors: null, note: "Produce-focused" },
};
function marketFood(place) { return MARKET_FOOD[place.id] || null; }


function similarPlaces(place, count = 3) {
  if (!place) return [];
  return PLACES
    .filter((p) => p.id !== place.id)
    .map((p) => {
      let score = 0;
      if (p.category === place.category) score += 3;
      (p.tags || []).forEach((t) => { if ((place.tags || []).includes(t)) score += 1; });
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.distanceMi - b.p.distanceMi)
    .slice(0, count)
    .map((x) => x.p);
}
function isClassBased(place) { const ci = CLASS_INFO[place.id]; return !!(ci && ci.classBased); }

// Categories that belong in the Activities & Programs directory.
const ACTIVITY_GROUPS = [
  { label: "Sports & Active", cats: ["Sports Program", "Gym & Classes", "Martial Arts"] },
  { label: "Dance", cats: ["Dance Classes"] },
  { label: "Music", cats: ["Music Classes"] },
  { label: "Art & Making", cats: ["Art Studio"] },
  { label: "Afterschool & Enrichment", cats: ["Afterschool", "Kids' Studio"] },
  { label: "Daycare & Preschool", cats: ["Daycare & Preschool"] },
];

function ageFromBirthday(bday) {
  if (!bday) return "";
  const b = new Date(bday);
  if (isNaN(b.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age < 0 ? "" : age;
}
function ageToBand(age) {
  if (age === "" || age == null) return "2-4";
  if (age < 1) return "0-1";
  if (age < 2) return "1-2";
  if (age < 4) return "2-4";
  if (age < 6) return "4-6";
  return "6-10";
}

// ---- Rewards: badges, stamps, streaks ----
const BADGES = [
  { id: "first", label: "First Adventure", emoji: "🌟", test: (s) => s.adventures >= 1 },
  { id: "five", label: "Explorer", emoji: "🧭", test: (s) => s.adventures >= 5 },
  { id: "ten", label: "Adventurer", emoji: "🗺️", test: (s) => s.adventures >= 10 },
  { id: "legend", label: "Little Legend", emoji: "🏆", test: (s) => s.adventures >= 25 },
  { id: "animals", label: "Animal Lover", emoji: "🐾", test: (s) => (s.byTag.animals || 0) >= 3 },
  { id: "hiker", label: "Little Hiker", emoji: "🥾", test: (s) => ((s.byTag.hiking || 0) + (s.byTag.nature || 0)) >= 3 },
  { id: "water", label: "Water Baby", emoji: "💦", test: (s) => (s.byTag.water || 0) >= 3 },
  { id: "sweet", label: "Sweet Tooth", emoji: "🍦", test: (s) => (s.byCat["Ice Cream"] || 0) >= 2 },
  { id: "book", label: "Bookworm", emoji: "📚", test: (s) => ((s.byCat.Library || 0) + (s.byCat.Bookstore || 0)) >= 2 },
  { id: "regular", label: "Regular", emoji: "📍", test: (s) => (s.checkInsTotal || 0) >= 10 },
];

function weekIndex(dt) {
  return Math.floor(new Date(dt).getTime() / (7 * 24 * 3600 * 1000));
}
function computeStats(completedDays, checkIns = {}) {
  const byTag = {}, byCat = {};
  let placesVisited = 0;
  completedDays.forEach((d) => {
    d.stops.forEach((st) => {
      placesVisited++;
      byCat[st.category] = (byCat[st.category] || 0) + 1;
      (st.tags || []).forEach((t) => { byTag[t] = (byTag[t] || 0) + 1; });
    });
  });
  let checkInsTotal = 0;
  Object.entries(checkIns).forEach(([pid, cnt]) => {
    checkInsTotal += cnt;
    const pl = PLACES.find((p) => p.id === pid);
    if (pl) {
      byCat[pl.category] = (byCat[pl.category] || 0) + cnt;
      (pl.tags || []).forEach((t) => { byTag[t] = (byTag[t] || 0) + cnt; });
    }
  });
  placesVisited += checkInsTotal;
  const rewardsEarned = Object.values(checkIns).reduce((a, c) => a + Math.floor(c / 5), 0);
  const idx = [...new Set(completedDays.map((d) => weekIndex(d.date)))].sort((a, b) => b - a);
  let streakWeeks = 0;
  if (idx.length) {
    streakWeeks = 1;
    for (let i = 1; i < idx.length; i++) { if (idx[i] === idx[i - 1] - 1) streakWeeks++; else break; }
  }
  return { adventures: completedDays.length, placesVisited, byTag, byCat, streakWeeks, checkInsTotal, rewardsEarned };
}
function isOpenNow(place, nowHour) {
  const h = placeHours(place);
  if (!h) return null;
  return nowHour >= h[0] && nowHour < h[1];
}

// Adaptive packing: build a checklist from the tags/categories in a plan.
function packingFor(items) {
  const tags = new Set();
  items.forEach((it) => it.place.tags.forEach((t) => tags.add(t)));
  const cats = new Set(items.map((it) => it.place.category));
  const list = [];
  const add = (label) => { if (!list.includes(label)) list.push(label); };

  add("💧 Water bottles");
  add("🍎 Snacks");
  add("🧻 Wipes & tissues");
  if (tags.has("water")) { add("🩱 Swimsuits & towel"); add("👟 Water shoes"); }
  if (tags.has("outdoor")) { add("🧢 Sunhat & sunscreen"); }
  if (tags.has("nature") || tags.has("hiking")) { add("🦟 Bug spray"); add("👟 Comfy shoes"); }
  if (tags.has("animals")) { add("🧴 Hand sanitizer"); }
  if (cats.has("Indoor Playground")) { add("🧦 Grippy socks"); }
  if (tags.has("seasonal")) { add("💵 Cash for the stand"); }
  if (items.some((it) => it.place.stroller === false)) { add("🎒 Baby carrier"); }
  return list;
}

const REVIEWS_SEED = {
  "muscoot-farm": [
    { id: "r1", stars: 5, text: "Our go-to Saturday morning. Kids adore the goats and the paths are easy with a stroller.", author: "A local parent", when: "2 weeks ago" },
    { id: "r2", stars: 4, text: "Free and lovely. Bring your own snacks — not much food on site.", author: "A local parent", when: "1 month ago" },
  ],
  "westchester-childrens-museum": [
    { id: "r3", stars: 5, text: "Perfect rainy-day rescue. Two hours flew by and everyone napped after.", author: "A local parent", when: "3 weeks ago" },
  ],
};

const ReviewsContext = React.createContext({ reviews: {}, addReview: () => {} });
const NavContext = React.createContext({ goHome: () => {} });

function reviewStats(reviews, placeId) {
  const list = reviews[placeId] || [];
  if (!list.length) return { avg: 0, count: 0 };
  const avg = list.reduce((s, r) => s + r.stars, 0) / list.length;
  return { avg, count: list.length };
}

function Stars({ value, size = 14, onPick }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={!onPick}
          onClick={onPick ? () => onPick(i) : undefined}
          style={{ lineHeight: 0, cursor: onPick ? "pointer" : "default" }}
        >
          <Star size={size} color="#E0A43B" fill={i <= Math.round(value) ? "#E0A43B" : "none"} />
        </button>
      ))}
    </span>
  );
}

function isEventToday(ev) {
  const d = new Date().getDay(); // 0=Sun..6=Sat
  const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d];
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
  const s = (ev.day || "").toLowerCase();
  if (s.includes("daily") || s.includes("every day")) return true;
  if (s.includes(short.toLowerCase()) || s.includes(full.toLowerCase())) return true;
  if (s.includes("weekend") && (d === 0 || d === 6)) return true;
  return false;
}

const EVENTS_SEED = [
  { id: "e1", title: "Toddler Story Hour", placeId: "katonah-library", day: "Tue & Thu", time: "10:00 AM", emoji: "📖", blurb: "Songs, rhymes and a picture book for the under-5 crowd." },
  { id: "e2", title: "Weekend on the Farm", placeId: "muscoot-farm", day: "Sat & Sun", time: "10:00 AM", emoji: "🐴", blurb: "Meet the animals, wagon area, and seasonal family activities." },
  { id: "e3", title: "Family Farm Workshop", placeId: "stone-barns", day: "Saturdays", time: "11:00 AM", emoji: "🌱", blurb: "Hands-on kids' workshop — book tickets in advance." },
  { id: "e4", title: "Kids' Concert on the Lawn", placeId: "caramoor", day: "Select Sundays", time: "1:00 PM", emoji: "🎵", blurb: "Short, lively outdoor concerts made for little ears." },
  { id: "e5", title: "Fall Festival", placeId: "outhouse-orchards", day: "Fall weekends", time: "All day", emoji: "🍎", blurb: "Apple picking, hayrides and cider doughnuts in season." },
  { id: "e6", title: "Family Fun Night", placeId: "bedford-hills-diner", day: "Every Tuesday", time: "6–7 PM", emoji: "🎩", featured: true, free: true, blurb: "Free family event with special guest characters — leave the cooking to the diner. Call to reserve a table." },
  { id: "e7", title: "Katonah Farmers Market", placeId: "john-jay", day: "Saturdays", time: "9 AM–1 PM", emoji: "🧺", free: true, blurb: "The village market at John Jay Homestead — organic produce, meat & eggs, and artisan foods. Seasonal." },
  { id: "e8", title: "Muscoot Farm Market", placeId: "muscoot-farm", day: "Sundays", time: "9:30 AM–2:30 PM", emoji: "🥕", free: true, blurb: "Shop the Sunday market, then visit the farm animals — the perfect combo morning. April–November." },
  { id: "e9", title: "Pleasantville Farmers Market", placeId: "pleasantville-market", day: "Saturdays", time: "8:30 AM–1 PM", emoji: "🎵", free: true, blurb: "The county's biggest market — live music and kids' events every week, year-round." },
  { id: "e10", title: "Chappaqua Farmers Market", placeId: "chappaqua-market", day: "Saturdays", time: "8:30 AM–1 PM", emoji: "🍎", free: true, blurb: "40+ vendors, music and kids' activities at the train station. May–mid-December." },
  { id: "e11", title: "The TaSH Market", placeId: "tash-market", day: "Saturdays", time: "8:30 AM–1:30 PM", emoji: "🎶", free: true, blurb: "Music, cooking demos and art projects for kids in Patriots Park. Memorial Day–Thanksgiving." },
  { id: "e12", title: "Mount Kisco Farmers Market", placeId: "mtkisco-market", day: "Sundays", time: "10 AM–2 PM", emoji: "🌽", free: true, blurb: "Sunday market with entertainment and family activities on Moger Ave. May–November." },
];

const FRIENDS_SEED = [
  { id: "sofia", name: "Sofia R.", emoji: "👩🏻", kids: "Mia (3), Leo (5)", town: "Chappaqua", demo: true },
  { id: "dana", name: "Dana K.", emoji: "👨🏽", kids: "Noah (2)", town: "Pleasantville", demo: true },
  { id: "priya", name: "Priya M.", emoji: "👩🏾", kids: "Ava (4)", town: "Mount Kisco", demo: true },
];

const SHARED_DAYS_SEED = [
  {
    id: "sd1",
    by: "Sofia R.",
    byEmoji: "👩🏻",
    title: "Our easy Saturday",
    stops: [
      { placeId: "muscoot-farm", time: 9.5 },
      { placeId: "king-kone", time: 11.5 },
    ],
  },
];

const PLAYDATES_SEED = [
  {
    id: "pd1",
    direction: "incoming",
    friend: "Dana K.",
    friendEmoji: "👨🏽",
    placeId: "saxon-woods",
    time: 10.5,
    day: "Saturday",
    status: "pending",
  },
];

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */
function buildItinerary(prefs) {
  let pool = [...PLACES];

  // Multi-kid compromise: places don't have per-age data yet, so this is a
  // light-touch first pass — skip categories that clearly skew to one age
  // band when the group spans more than one distinct age.
  const allAges = new Set([prefs.age, ...(prefs.companionAges || [])].filter(Boolean));
  if (allAges.size > 1) {
    pool = pool.filter((p) => p.category !== "Daycare & Preschool");
  }

  // weather intelligence
  if (WEATHER.condition === "rain") {
    pool = pool.filter((p) => p.tags.includes("indoor") || p.tags.includes("rain-friendly"));
  } else if (prefs.setting === "indoor") {
    pool = pool.filter((p) => p.tags.includes("indoor"));
  } else if (prefs.setting === "outdoor") {
    pool = pool.filter((p) => !p.tags.includes("indoor") || p.tags.includes("rain-friendly"));
  }

  pool = pool.filter((p) => p.distanceMi <= prefs.distance);

  if (prefs.interests.length) {
    pool.sort((a, b) => {
      const score = (p) => p.tags.filter((t) => prefs.interests.includes(t)).length;
      return score(b) - score(a);
    });
  }

  if (prefs.budget === "free") {
    pool = pool.filter((p) => p.price === "Free");
  }

  const startHour = prefs.startHour;
  const endHour = prefs.endHour;
  const window = Math.max(endHour - startHour, 0.5);

  // Reserve room for meal stops so activities don't crowd them out.
  const wantLunch = prefs.includeLunch && prefs.budget !== "free";
  const mealCount = (wantLunch ? 1 : 0) + (prefs.includeFood ? 1 : 0);
  const maxActivities = Math.max(1, Math.floor(window) - mealCount);

  let activityPool = pool.filter((p) => !["Ice Cream", "Restaurant", "Toy Store", "Store", "Sports Program", "Afterschool"].includes(p.category));
  if (prefs.shuffle) {
    const k = Math.max(prefs.stops + 5, 8);
    const top = activityPool.slice(0, k);
    for (let i = top.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [top[i], top[j]] = [top[j], top[i]]; }
    activityPool = top.concat(activityPool.slice(k));
  }

  // Keep the day varied: skip a place if we've already picked its category or
  // primary group twice (so no itinerary is two parks or two farms back to back).
  // Only relax the rule if there truly isn't enough variety to fill the day.
  const wanted = Math.min(prefs.stops, maxActivities);
  let activity = [];
  const catCount = {};
  const groupCount = {};
  for (const p of activityPool) {
    if (activity.length >= wanted) break;
    const cat = p.category;
    const grp = typeof primaryGroup === "function" ? primaryGroup(p) : cat;
    const catSeen = catCount[cat] || 0;
    const groupSeen = groupCount[grp] || 0;
    if (catSeen >= 1 || groupSeen >= 2) continue; // at most one of the same category, two of the same group
    activity.push(p);
    catCount[cat] = catSeen + 1;
    groupCount[grp] = groupSeen + 1;
  }
  // Fill any remaining slots (only happens if the filtered area is genuinely thin on variety).
  if (activity.length < wanted) {
    for (const p of activityPool) {
      if (activity.length >= wanted) break;
      if (!activity.includes(p)) activity.push(p);
    }
  }

  let stops = [...activity];

  // Slot a lunch stop into the middle if the day spans midday.
  if (wantLunch) {
    const restaurants = PLACES
      .filter((p) => p.category === "Restaurant" && p.distanceMi <= prefs.distance)
      .sort((a, b) => a.distanceMi - b.distanceMi);
    const lunch = prefs.shuffle && restaurants.length
      ? restaurants[Math.floor(Math.random() * Math.min(restaurants.length, 5))]
      : restaurants[0];
    const spansMidday = startHour <= 13 && endHour >= 12;
    if (lunch && spansMidday) {
      const mid = Math.max(1, Math.round(stops.length / 2));
      stops.splice(mid, 0, lunch);
    }
  }

  // Optional treat at the end.
  const treat = PLACES.find((p) => p.id === "king-kone");
  if (prefs.includeFood && treat && !stops.includes(treat)) stops.push(treat);

  // Spread stops across the window, leaving a little buffer before the deadline.
  const usable = Math.max(window - 0.5, stops.length * 0.75);
  const gap = stops.length > 1 ? usable / stops.length : 0;

  return stops.map((place, i) => ({
    place,
    time: startHour + i * gap,
  }));
}

// round a decimal hour to the nearest 15 minutes
function roundToQuarter(h) {
  return Math.round(h * 4) / 4;
}

function currentHour() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

function formatHour(h) {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${min.toString().padStart(2, "0")} ${period}`;
}

/* ---------------------------------------------------------
   SUNRISE ARC — signature element: the itinerary is drawn as
   the sun's actual arc across the day, activities as stops on it
--------------------------------------------------------- */
function SunriseArc({ items, onSelect }) {
  if (!items.length) return null;
  const first = items[0].time;
  const last = items[items.length - 1].time;
  const span = Math.max(last - first, 1);
  const width = 340;
  const height = 150;

  return (
    <div className="relative" style={{ width: "100%", maxWidth: width }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        <path
          d={`M 20 130 Q ${width / 2} 10 ${width - 20} 130`}
          fill="none"
          stroke="#FFE1B8"
          strokeWidth="4"
        />
        {items.map((item, i) => {
          const t = items.length === 1 ? 0.5 : (item.time - first) / span;
          const x = 20 + t * (width - 40);
          const y = 130 - Math.sin(t * Math.PI) * 110;
          return (
            <g
              key={item.place.id}
              transform={`translate(${x},${y})`}
              onClick={() => onSelect(item.place)}
              style={{ cursor: "pointer" }}
            >
              <circle r="16" fill="var(--accent)" stroke="#FFFBF5" strokeWidth="3" />
              <text
                textAnchor="middle"
                dy="5"
                fontSize="14"
                style={{ pointerEvents: "none" }}
              >
                {item.place.photo}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   SHARED UI BITS
--------------------------------------------------------- */
function SunriseSplash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onDone, 420);
  };
  useEffect(() => {
    const t = setTimeout(finish, 1900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      onClick={finish}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(180deg, #FFFBF5 0%, #FFF3E6 60%, #FFE8CF 100%)",
        animation: leaving ? "splashOut 0.42s ease-in forwards" : "none",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute", left: "50%", bottom: -210, width: 420, height: 420,
          marginLeft: -210, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,183,31,0.30) 0%, rgba(245,183,31,0) 70%)",
          animation: "glowUp 1.5s ease-out forwards",
        }}
      />
      <div style={{ animation: "sunRise 1.25s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}>
        <LittleDaySun size={132} animateRays />
      </div>
      <div style={{ marginTop: 12, textAlign: "center", animation: "fadeUp 0.7s ease-out 0.75s both" }}>
        <p style={{ fontSize: 30, fontWeight: 800, color: "#1B2A4A", margin: 0 }}>little day</p>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#F5B71F", marginTop: 4 }}>
          BIG ADVENTURES. LITTLE DAYS.
        </p>
      </div>
      <style>{`
        @keyframes sunRise { from { transform: translateY(110px) scale(0.82); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes rayPop { from { transform: scale(0.25); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes glowUp { from { transform: translateY(90px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes splashOut { to { opacity: 0; transform: translateY(-24px); } }
      `}</style>
    </div>
  );
}

function LittleDaySun({ size = 40, animateRays = false }) {
  const cx = 50, cy = 56, rInner = 40, rOuter = 50;
  const angles = [18, 42, 66, 90, 114, 138, 162];
  return (
    <svg viewBox="0 0 100 66" width={size} height={size * 0.66} aria-hidden="true">
      {angles.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + rInner * Math.cos(a)}
            y1={cy - rInner * Math.sin(a)}
            x2={cx + rOuter * Math.cos(a)}
            y2={cy - rOuter * Math.sin(a)}
            stroke="#F5B71F"
            strokeWidth="4.5"
            strokeLinecap="round"
            style={animateRays ? { transformOrigin: `${cx}px ${cy}px`, animation: `rayPop 0.5s ease-out ${0.55 + i * 0.07}s both` } : undefined}
          />
        );
      })}
      <path d="M 15 56 A 35 35 0 0 1 85 56 Z" fill="#F5B71F" />
      <circle cx="41" cy="45" r="3.4" fill="#16284A" />
      <circle cx="59" cy="45" r="3.4" fill="#16284A" />
      <path d="M 41.5 51 Q 50 58.5 58.5 51" fill="none" stroke="#16284A" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function LittleDayWordmark({ size = 22 }) {
  return (
    <span
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 600,
        fontSize: size,
        color: "#16284A",
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}
    >
      little day
    </span>
  );
}

function LittleDayLockup({ sunSize = 44, wordSize = 24, tagline = false }) {
  return (
    <div className="flex flex-col items-center">
      <LittleDaySun size={sunSize} />
      <div className="-mt-0.5">
        <LittleDayWordmark size={wordSize} />
      </div>
      {tagline && (
        <p
          className="mt-1.5"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#16284A",
            textTransform: "uppercase",
          }}
        >
          Big adventures. Little days.
        </p>
      )}
    </div>
  );
}

function TopBar({ title, onBack, right, hideHome }) {
  const { goHome } = useContext(NavContext);
  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-3">
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1 text-[#1B2A4A]">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1
        className="text-[19px] font-semibold text-[#1B2A4A] flex-1"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {title}
      </h1>
      {right}
      {!hideHome && (
        <button
          onClick={goHome}
          title="Back to home"
          className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full"
          style={{ backgroundColor: "#FFF3E6" }}
        >
          <LittleDaySun size={16} />
          <span className="text-[12px] font-semibold" style={{ color: "#B08A5A" }}>Home</span>
        </button>
      )}
    </div>
  );
}

function Pill({ children, active, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="px-3.5 py-2 rounded-full text-sm font-medium border transition-colors"
      style={{
        borderColor: active ? "#1B2A4A" : "#E7E1D4",
        opacity: disabled ? 0.45 : 1,
        backgroundColor: active ? "#1B2A4A" : "#FFFFFF",
        color: active ? "#FFFBF5" : "#5C5648",
      }}
    >
      {children}
    </button>
  );
}

function BottomNav({ screen, setScreen }) {
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "map", label: "Categories", icon: ListIcon },
    { key: "friends", label: "Friends", icon: Users },
    { key: "safety", label: "Safety", icon: Shield },
    { key: "profile", label: "My Profile", icon: User },
  ];
  return (
    <div
      className="flex justify-around items-center border-t bg-white/95 backdrop-blur"
      style={{ borderColor: "#EFEAE0", paddingBottom: "env(safe-area-inset-bottom, 10px)" }}
    >
      {items.map(({ key, label, icon: Icon }) => {
        const active = screen === key;
        return (
          <button
            key={key}
            onClick={() => setScreen(key)}
            className="flex flex-col items-center gap-1 py-2.5 px-3"
          >
            <Icon size={22} color={active ? "var(--accent)" : "#9C9484"} strokeWidth={active ? 2.4 : 2} />
            <span
              className="text-[11px] font-medium"
              style={{ color: active ? "#1B2A4A" : "#9C9484" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function parsePrice(str) {
  const s = str || "";
  const free = /free/i.test(s);
  const dollars = (s.match(/\$/g) || []).length;
  let note = s.replace(/free/i, "").replace(/\$/g, "").replace(/\//g, " ").trim();
  note = note.replace(/\s+/g, " ");
  return { free, dollars, note };
}

const TIER_LABEL = { 1: "Low cost", 2: "Moderate", 3: "Splurge" };

function PriceBadge({ price, detail = false }) {
  const { free, dollars, note } = parsePrice(price);

  if (free) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-bold ${
          detail ? "px-3.5 py-1.5 text-[13px]" : "px-2.5 py-0.5 text-[11px]"
        }`}
        style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}
      >
        <span>✨</span>
        <span>{detail ? "Totally free" : "Free"}{note ? ` · ${note}` : ""}</span>
      </span>
    );
  }

  const tier = Math.min(Math.max(dollars, 1), 3);
  const coins = [1, 2, 3].map((i) => (
    <span key={i} style={{ color: i <= tier ? "#E0A43B" : "#DFD8C7", fontWeight: 800 }}>
      $
    </span>
  ));

  if (!detail) {
    return (
      <span
        className="inline-flex items-center gap-[1px] rounded-full px-2.5 py-0.5 text-[12px]"
        style={{ backgroundColor: "#F7F1E4" }}
      >
        {coins}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px]"
      style={{ backgroundColor: "#F7F1E4" }}
    >
      <span className="text-[14px] tracking-tight">{coins}</span>
      <span className="font-semibold" style={{ color: "#96824F" }}>
        {TIER_LABEL[tier]}
        {note ? ` · ${note}` : ""}
      </span>
    </span>
  );
}

function hoursLabel(place) {
  const h = HOURS[place.id];
  if (!h) return null;
  return `${formatHour(h[0])} \u2013 ${formatHour(h[1])}`;
}

function HoursChip({ place, size = "sm" }) {
  const label = hoursLabel(place);
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${size === "lg" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[11px]"} font-medium`}
      style={{ backgroundColor: "#F0EEE6", color: "#5C5648" }}
    >
      <Clock size={size === "lg" ? 12 : 10} /> {label}
    </span>
  );
}

function OpenNowBadge({ place, nowHour, showClosed = true }) {
  const open = isOpenNow(place, nowHour);
  if (open === null) return null;
  if (!open && !showClosed) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: open ? "#E4F4E9" : "#F3ECEC", color: open ? "#2E8B57" : "#B06A63" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: open ? "#2E8B57" : "#B06A63" }} />
      {open ? "Open now" : "Closed now"}
    </span>
  );
}

function PlaceCard({ place, onSelect, favorited, onToggleFavorite, nowHour }) {
  const nh = nowHour != null ? nowHour : currentHour();
  const { reviews } = useContext(ReviewsContext);
  const stats = reviewStats(reviews, place.id);
  return (
    <div
      onClick={() => onSelect(place)}
      className="flex gap-3 p-3 rounded-2xl bg-white border cursor-pointer active:scale-[0.99] transition-transform"
      style={{ borderColor: "#EFEAE0" }}
    >
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
        style={{ backgroundColor: "#FFF3E6" }}
      >
        {place.photo}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[15px] text-[#1B2A4A] truncate">{place.name}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(place.id);
            }}
            className="shrink-0"
          >
            <Heart
              size={18}
              color={favorited ? "var(--accent)" : "#C9C2B2"}
              fill={favorited ? "var(--accent)" : "none"}
            />
          </button>
        </div>
        <p className="text-[13px] text-[#8A8474]">
          {place.category} · {place.town} · {place.distanceMi} mi
        </p>
        {stats.count > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <Stars value={stats.avg} size={12} />
            <span className="text-[11px] text-[#8A8474]">
              {stats.avg.toFixed(1)} · {stats.count} review{stats.count !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        <div className="flex gap-1.5 mt-1.5 items-center flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0EEE6] text-[#5C5648]">
            Ages {place.ageRange}
          </span>
          <PriceBadge price={place.price} />
          <OpenNowBadge place={place} nowHour={nh} showClosed={false} />
          <HoursChip place={place} />
          {foodInfo(place) && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3E6", color: "#B08A5A" }}>{foodInfo(place).cuisine}</span>
          )}
          {foodInfo(place)?.gf === true && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>GF</span>
          )}
          {isClassBased(place) && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF0F5", color: "#5B6B8C" }}>Sign-up</span>
          )}
          {classInfo(place)?.freeTrial === true && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Free trial</span>
          )}
          {placePerks(place).length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3E6", color: "#B08A5A" }}>
              🖍️ Child perks
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   SCREENS
--------------------------------------------------------- */
function daysUntilNextBirthday(bday) {
  if (!bday) return null;
  const b = new Date(bday);
  if (isNaN(b)) return null;
  const now = new Date();
  let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / (1000 * 3600 * 24));
}

function HomeSmartBanners({ kids, companionKidIds, schoolDistrictId, onSetSchoolDistrict, completedDays, onOpenBuilder }) {
  const [dismissedId, setDismissedId] = useState(null);
  const [pickingDistrict, setPickingDistrict] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const dow = new Date().getDay(); // 0 = Sun, 1 = Mon

  const banners = [];

  if (schoolDistrictId && isNoSchoolDay(schoolDistrictId, todayStr)) {
    banners.push({ id: `noschool-${todayStr}`, emoji: "🎒", text: "No school today — a perfect day for an adventure.", cta: "Plan today", action: onOpenBuilder });
  } else if (!schoolDistrictId) {
    banners.push({ id: "pick-district", emoji: "🏫", text: "Add your school district to get no-school-day heads-ups.", cta: "Choose district", action: () => setPickingDistrict(true) });
  }

  if (WEATHER.tomorrow) {
    if (WEATHER.tomorrow.rainy) {
      banners.push({ id: `rain-${todayStr}`, emoji: "🌧️", text: `Rain expected tomorrow (${WEATHER.tomorrow.tempF}°) — good day to pick something indoors.`, cta: "See indoor picks", action: onOpenBuilder });
    } else if (WEATHER.tomorrow.greatDay) {
      banners.push({ id: `nice-${todayStr}`, emoji: "☀️", text: `Tomorrow looks great — ${WEATHER.tomorrow.tempF}° and clear. Good day to be outside.`, cta: "Plan tomorrow", action: onOpenBuilder });
    }
  }

  (kids || []).forEach((k) => {
    const d = daysUntilNextBirthday(k.birthday);
    if (d != null && d <= 30) {
      const soon = d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
      banners.push({ id: `bday-${k.id}`, emoji: "🎂", text: `${k.name || "Your child"}'s birthday is ${soon} — new places open up as they get older.`, cta: null, action: null });
    }
  });

  if ((dow === 0 || dow === 1) && completedDays && completedDays.length >= 0) {
    banners.push({ id: `sunday-${todayStr}`, emoji: "🗓️", text: "Planning the week ahead? Pick a day and build something fun.", cta: "Plan a day this week", action: onOpenBuilder });
  }

  const visible = banners.find((b) => b.id !== dismissedId);
  if (!visible && !pickingDistrict) return null;

  return (
    <>
      {visible && (
        <div className="flex items-start gap-2.5 mt-3 p-3 rounded-2xl" style={{ backgroundColor: "#FFF6F0" }}>
          <span className="text-[18px] shrink-0">{visible.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] text-[#1B2A4A] leading-snug">{visible.text}</p>
            {visible.cta && (
              <button onClick={visible.action} className="text-[12px] font-semibold mt-1" style={{ color: "var(--accent)" }}>{visible.cta} →</button>
            )}
          </div>
          <button onClick={() => setDismissedId(visible.id)} className="shrink-0 text-[#B8B0A0]"><X size={15} /></button>
        </div>
      )}
      {pickingDistrict && (
        <div className="mt-3 p-3 rounded-2xl border" style={{ borderColor: "#EFEAE0", backgroundColor: "#fff" }}>
          <p className="text-[12.5px] font-semibold text-[#1B2A4A] mb-2">Which school district?</p>
          <div className="flex flex-col gap-1.5">
            {SCHOOL_DISTRICTS.map((d) => (
              <button key={d.id} onClick={() => { onSetSchoolDistrict(d.id); setPickingDistrict(false); }} className="text-left p-2 rounded-xl border text-[13px]" style={{ borderColor: "#EFEAE0" }}>
                {d.name}
              </button>
            ))}
            <button onClick={() => setPickingDistrict(false)} className="text-[12px] text-[#B8B0A0] text-center mt-1">Not listed / skip for now</button>
          </div>
        </div>
      )}
    </>
  );
}

function HomeScreen({ setScreen, favorites, toggleFavorite, setSelectedPlace, location, onRequestLocation, onSurprise, kids, activeKidId, onSetActive, searchQuery, setSearchQuery, onHowTo, onSelectGoogle,
  companionKidIds, onToggleCompanionKid, schoolDistrictId, onSetSchoolDistrict, completedDays, onOpenBuilder,
}) {
  const nearby = PLACES.slice(0, 4);
  const hq = (searchQuery || "").trim().toLowerCase();
  const homeResults = hq
    ? PLACES.filter((p) =>
        p.name.toLowerCase().includes(hq) ||
        p.town.toLowerCase().includes(hq) ||
        p.category.toLowerCase().includes(hq) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(hq))
      ).slice(0, 8)
    : [];
  const { results: gResults, searching: gSearching } = useGoogleSearch(searchQuery, homeResults.length);
  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <LittleDaySun size={32} />
          <LittleDayWordmark size={22} />
          <button onClick={onHowTo} className="ml-auto flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-full" style={{ backgroundColor: "#FFF3E6", color: "#B08A5A" }}>
            <HelpCircle size={14} /> How it works
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sun size={20} color="#F5B71F" />
          <span className="text-[13px] font-medium" style={{ color: "#B08A5A" }}>
            {WEATHER.tempF}° and sunny
          </span>
        </div>
        <LocationBar location={location} onRequest={onRequestLocation} />
        {kids && kids.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto">
            <span className="text-[12px] text-[#8A8474] shrink-0">Planning for</span>
            {kids.map((k) => {
              const active = k.id === activeKidId;
              return (
                <button key={k.id} onClick={() => onSetActive(k.id)} className="flex items-center gap-1 pl-1 pr-2.5 py-1 rounded-full border shrink-0"
                  style={{ borderColor: active ? "var(--accent)" : "#E7E1D4", backgroundColor: active ? "#FFF6F0" : "#fff" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[14px]" style={{ backgroundColor: "#FFF3E6" }}>{k.emoji}</span>
                  <span className="text-[12px] font-medium" style={{ color: active ? "#1B2A4A" : "#8A8474" }}>{k.name || "Child"}</span>
                </button>
              );
            })}
          </div>
        )}
        {kids && kids.length > 1 && (
          <div className="flex items-center gap-2 mt-1.5 overflow-x-auto">
            <span className="text-[11px] text-[#B8B0A0] shrink-0">Also bringing</span>
            {kids.filter((k) => k.id !== activeKidId).map((k) => {
              const on = companionKidIds.includes(k.id);
              return (
                <button key={k.id} onClick={() => onToggleCompanionKid(k.id)} className="flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full border shrink-0"
                  style={{ borderColor: on ? "var(--accent)" : "#EFEAE0", backgroundColor: on ? "#FFF6F0" : "#FAF8F3" }}>
                  <span className="text-[11px]">{k.emoji}</span>
                  <span className="text-[11px] font-medium" style={{ color: on ? "#1B2A4A" : "#B8B0A0" }}>{k.name || "Child"}</span>
                </button>
              );
            })}
          </div>
        )}
        <HomeSmartBanners kids={kids} companionKidIds={companionKidIds} schoolDistrictId={schoolDistrictId} onSetSchoolDistrict={onSetSchoolDistrict} completedDays={completedDays} onOpenBuilder={onOpenBuilder} />
        <p className="text-[13px] font-medium mt-3 mb-1" style={{ color: "#B08A5A" }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1
          className="text-[26px] leading-tight font-bold text-[#1B2A4A]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          What should we do today?
        </h1>
      </div>

      <div className="px-5 mt-1">
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 border bg-white" style={{ borderColor: "#E7E1D4" }}>
          <Search size={17} color="#9C9484" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, towns, or categories"
            className="flex-1 text-[14px] outline-none bg-transparent text-[#1B2A4A]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}><X size={16} color="#9C9484" /></button>
          )}
        </div>
        {hq && (
          <div className="mt-2 rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "#EFEAE0" }}>
            {homeResults.length === 0 && gResults.length === 0 ? (
              <p className="text-[13px] text-[#8A8474] p-4">
                {gSearching ? "Searching nearby…" : "No matches for “" + searchQuery + "”. Try a place, town, or category like “playground.”"}
              </p>
            ) : (
              <>
                {homeResults.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPlace(p)} className="w-full flex items-center gap-3 p-3 text-left border-b last:border-b-0" style={{ borderColor: "#F3F0E8" }}>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>{p.photo}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium text-[#1B2A4A] truncate">{p.name}</span>
                      <span className="block text-[12px] text-[#8A8474] truncate">{p.category} · {p.town}</span>
                    </span>
                  </button>
                ))}
                {gResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 flex items-center gap-1.5" style={{ backgroundColor: "#F7F5EF" }}>
                      <p className="text-[11px] font-semibold" style={{ color: "#8A8474" }}>ALSO ON GOOGLE MAPS</p>
                      <span className="text-[10px]" style={{ color: "#B8B0A0" }}>· not parent-verified yet</span>
                    </div>
                    {gResults.map((p) => (
                      <button key={p.id} onClick={() => onSelectGoogle && onSelectGoogle(p)} className="w-full flex items-center gap-3 p-3 text-left border-b last:border-b-0" style={{ borderColor: "#F3F0E8" }}>
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: "#F3F5F9" }}>{p.photo}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-medium text-[#1B2A4A] truncate">{p.name}</span>
                          <span className="block text-[12px] text-[#8A8474] truncate">{p.category} · {p.town}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
                <button onClick={() => setScreen("map")} className="w-full text-center text-[13px] font-semibold py-2.5" style={{ color: "var(--accent)" }}>See all in Categories List →</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-5 mt-4">
        <button
          onClick={() => setScreen("planner")}
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-white font-semibold text-[16px] shadow-sm"
          style={{ background: "var(--cta)" }}
        >
          <Sparkles size={19} />
          Plan My Day
        </button>
        <button
          onClick={onSurprise}
          className="w-full rounded-2xl py-3 mt-2.5 flex items-center justify-center gap-2 font-semibold text-[15px] border"
          style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "#fff" }}
        >
          <Shuffle size={17} />
          Surprise me
        </button>
      </div>

      <div className="px-5 mt-4">
        <button onClick={() => setScreen("activities")} className="w-full rounded-2xl p-4 flex items-center gap-3 border text-left" style={{ borderColor: "#EFEAE0", backgroundColor: "#fff" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]" style={{ backgroundColor: "#FFF3E6" }}>🤸</div>
          <div className="flex-1">
            <p className="font-semibold text-[14px] text-[#1B2A4A]">Classes & Activities</p>
            <p className="text-[12px] text-[#8A8474]">Sports, dance, music, art & afterschool programs</p>
          </div>
          <ChevronRight size={18} color="#C9C2B2" />
        </button>

        <button onClick={() => setScreen("community")} className="w-full rounded-2xl p-4 flex items-center gap-3 border text-left mt-2.5" style={{ borderColor: "#EFEAE0", backgroundColor: "#fff" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]" style={{ backgroundColor: "#FFF3E6" }}>🎪</div>
          <div className="flex-1">
            <p className="font-semibold text-[14px] text-[#1B2A4A]">Community Events</p>
            <p className="text-[12px] text-[#8A8474]">Markets, story hours, festivals & family nights</p>
          </div>
          <ChevronRight size={18} color="#C9C2B2" />
        </button>
      </div>

      <div className="px-5 mt-8 mb-1">
        <h2 className="font-semibold text-[15px] text-[#1B2A4A]">Happening this week</h2>
      </div>
      <div className="flex items-start gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
        {[...EVENTS_SEED]
          .sort((a, b) => ((isEventToday(b) ? 2 : 0) + (b.featured ? 1 : 0)) - ((isEventToday(a) ? 2 : 0) + (a.featured ? 1 : 0)))
          .map((ev) => {
          const pl = PLACES.find((p) => p.id === ev.placeId);
          return (
            <button
              key={ev.id}
              onClick={() => pl && setSelectedPlace(pl)}
              className="text-left shrink-0 rounded-2xl p-3.5 border relative overflow-hidden"
              style={{
                borderColor: isEventToday(ev) ? "#F5B71F" : "#EFEAE0",
                borderWidth: isEventToday(ev) ? 2 : 1,
                width: 218,
                height: 224,
                background: isEventToday(ev) ? "linear-gradient(160deg,#FFFBF0,#FFF3E6)" : "#FFFFFF",
              }}
            >
              <div className="mb-1.5" style={{ height: 22 }}>
                {isEventToday(ev) && (
                  <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "var(--cta)" }}>
                    🎉 TODAY
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[26px]">{ev.emoji}</div>
                <div className="flex items-center gap-1">
                  {ev.free && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>
                      Free
                    </span>
                  )}
                  {pl && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3E6", color: "#B08A5A" }}>
                      {pl.distanceMi} mi away
                    </span>
                  )}
                </div>
              </div>
              <p className="font-semibold text-[14px] text-[#1B2A4A] leading-snug">{ev.title}</p>
              <p className="text-[12px] text-[#8A8474] mt-0.5">
                {pl?.town} · {ev.day} · {ev.time}
              </p>
              <p className="text-[12px] text-[#5C5648] mt-1.5 leading-snug">{ev.blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="px-5 mt-8 flex items-center justify-between">
        <h2 className="font-semibold text-[15px] text-[#1B2A4A]">Family spots near you</h2>
      </div>
      <div className="px-5 mt-3 flex flex-col gap-2.5">
        {nearby.map((p) => (
          <PlaceCard
            key={p.id}
            place={p}
            onSelect={(pl) => setSelectedPlace(pl)}
            favorited={favorites.includes(p.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>

    </div>
  );
}

function PlannerScreen({ onBack, onGenerate, locationLabel, initialAge, activeKidName, companionKids }) {
  const now = new Date();
  const nowHour = roundToQuarter(now.getHours() + now.getMinutes() / 60);
  // sensible default deadline: 3.5 hrs from now, capped at 8pm
  const defaultEnd = Math.min(roundToQuarter(nowHour + 3.5), 20);

  const [age, setAge] = useState(initialAge || "2-4");
  const [budget, setBudget] = useState("any");
  const [distance, setDistance] = useState(15);
  const [startMode, setStartMode] = useState("now");
  const [dayOffset, setDayOffset] = useState(0);
  const [pickedDate, setPickedDate] = useState(new Date().toISOString().slice(0, 10));
  const [customStart, setCustomStart] = useState(9.5); // "now" | custom (future)
  const [endHour, setEndHour] = useState(defaultEnd);
  const [setting, setSetting] = useState("any");
  const [interests, setInterests] = useState([]);
  const [includeFood, setIncludeFood] = useState(true);
  const [includeLunch, setIncludeLunch] = useState(true);
  const [napAware, setNapAware] = useState(false);
  const [napHour, setNapHour] = useState(13);

  const startHour = startMode === "now" ? nowHour : startMode === "custom" ? customStart : 9.5;
  const windowHrs = Math.max(endHour - startHour, 0);

  const toggleInterest = (key) =>
    setInterests((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  return (
    <div className="pb-8">
      <TopBar title="Plan my day" onBack={onBack} />
      <div className="px-5 flex flex-col gap-6">
        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">
            Child's age{activeKidName ? <span style={{ color: "var(--accent)" }}> · pre-set for {activeKidName}</span> : ""}
          </p>
          {companionKids && companionKids.length > 0 && (
            <p className="text-[11.5px] mb-2" style={{ color: "#B08A5A" }}>
              Also bringing {companionKids.map((k) => k.name || "a sibling").join(", ")} — we'll try to skip anything too narrow for the group.
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {["0-1", "1-2", "2-4", "4-6", "6-10"].map((a) => (
              <Pill key={a} active={age === a} onClick={() => setAge(a)}>
                {a} yrs
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">Budget</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { k: "free", l: "Free only" },
              { k: "any", l: "Open to paid" },
            ].map((b) => (
              <Pill key={b.k} active={budget === b.k} onClick={() => setBudget(b.k)}>
                {b.l}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">
            How far will you travel? <span className="text-[#1B2A4A] font-semibold">{distance} mi</span>
          </p>
          <input
            type="range"
            min="1"
            max="50"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full [accent-color:var(--accent)]"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-[#9C9484]">1 mi</span>
            <span className="text-[11px] text-[#9C9484]">50 mi</span>
          </div>
          <p className="text-[12px] text-[#B08A5A] mt-1.5">Searching around {locationLabel}</p>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">Which day?</p>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2].map((off) => {
              const dt = new Date();
              dt.setDate(dt.getDate() + off);
              const label = off === 0 ? "Today" : off === 1 ? "Tomorrow" : dt.toLocaleDateString(undefined, { weekday: "long" });
              return (
                <Pill key={off} active={dayOffset === off} onClick={() => { setDayOffset(off); if (off !== 0 && startMode === "now") setStartMode("custom"); }}>
                  {label}{off > 0 ? ` · ${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                </Pill>
              );
            })}
            <Pill active={dayOffset === "pick"} onClick={() => { setDayOffset("pick"); if (startMode === "now") setStartMode("custom"); }}>
              Another day…
            </Pill>
          </div>
          {dayOffset === "pick" && (
            <input
              type="date"
              value={pickedDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setPickedDate(e.target.value)}
              className="mt-2 w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none"
              style={{ borderColor: "#E7E1D4" }}
            />
          )}
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">When are you starting?</p>
          <div className="flex gap-2 flex-wrap">
            {dayOffset === 0 && (
              <Pill active={startMode === "now"} onClick={() => setStartMode("now")}>
                Right now · {formatHour(nowHour)}
              </Pill>
            )}
            <Pill active={startMode === "morning"} onClick={() => setStartMode("morning")}>
              Morning · 9:30 AM
            </Pill>
            <Pill active={startMode === "custom"} onClick={() => setStartMode("custom")}>
              Pick a time
            </Pill>
          </div>

          {startMode === "custom" && (
            <div className="mt-3">
              <p className="text-[13px] font-medium text-[#8A8474] mb-2">
                Starting at <span className="text-[#1B2A4A] font-semibold">{formatHour(customStart)}</span>
              </p>
              <input
                type="range"
                min="6"
                max="19"
                step="0.5"
                value={customStart}
                onChange={(e) => setCustomStart(Number(e.target.value))}
                className="w-full [accent-color:var(--accent)]"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-[#9C9484]">6:00 AM</span>
                <span className="text-[11px] text-[#9C9484]">7:00 PM</span>
              </div>
            </div>
          )}

          {dayOffset !== 0 && (
            <p className="text-[11.5px] mt-1.5" style={{ color: "#B08A5A" }}>
              Planning ahead — we'll use typical opening hours for that day. Double-check seasonal spots before you go.
            </p>
          )}
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">
            Need to be home by <span className="text-[#1B2A4A] font-semibold">{formatHour(endHour)}</span>
          </p>
          <input
            type="range"
            min={Math.ceil(Math.max(startHour + 1, 10) * 2) / 2}
            max="21"
            step="0.5"
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full [accent-color:var(--accent)]"
          />
          <p className="text-[12px] mt-1.5" style={{ color: windowHrs < 1 ? "#C6564B" : "#B08A5A" }}>
            {windowHrs < 1
              ? "That's a tight window — try a later time or an earlier start."
              : `About ${windowHrs % 1 === 0 ? windowHrs : windowHrs.toFixed(1)} hrs to play, home before ${formatHour(endHour)}`}
          </p>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">Indoor or outdoor?</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { k: "any", l: "Either" },
              { k: "outdoor", l: "Outdoor" },
              { k: "indoor", l: "Indoor" },
            ].map((s) => (
              <Pill key={s.k} active={setting === s.k} onClick={() => setSetting(s.k)}>
                {s.l}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#8A8474] mb-2">What are they into today?</p>
          <div className="flex gap-2 flex-wrap">
            {INTERESTS.map((i) => (
              <Pill key={i.key} active={interests.includes(i.key)} onClick={() => toggleInterest(i.key)}>
                {i.icon} {i.label}
              </Pill>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={includeLunch}
            onChange={(e) => setIncludeLunch(e.target.checked)}
            className="w-4 h-4 [accent-color:var(--accent)]"
          />
          <span className="text-[14px] text-[#5C5648]">Add a lunch stop in the middle</span>
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={includeFood}
            onChange={(e) => setIncludeFood(e.target.checked)}
            className="w-4 h-4 [accent-color:var(--accent)]"
          />
          <span className="text-[14px] text-[#5C5648]">Add a treat stop at the end</span>
        </label>

        <div>
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={napAware}
              onChange={(e) => setNapAware(e.target.checked)}
              className="w-4 h-4 [accent-color:var(--accent)]"
            />
            <span className="text-[14px] text-[#5C5648] flex items-center gap-1.5">
              <Moon size={15} color="#8A8474" /> Home in time for nap
            </span>
          </label>
          {napAware && (
            <div className="mt-3 pl-7">
              <p className="text-[12px] text-[#8A8474] mb-1.5">
                Nap starts around <span className="text-[#1B2A4A] font-semibold">{formatHour(napHour)}</span>
              </p>
              <input
                type="range"
                min="11"
                max="16"
                step="0.5"
                value={napHour}
                onChange={(e) => setNapHour(Number(e.target.value))}
                className="w-full [accent-color:var(--accent)]"
              />
            </div>
          )}
        </div>

        <button
          onClick={() =>
            onGenerate({ plannedDate: dayOffset === "pick" ? pickedDate : (() => { const d = new Date(); d.setDate(d.getDate() + dayOffset); return d.toISOString().slice(0, 10); })(),
              age,
              companionAges: (companionKids || []).map((k) => ageToBand(ageFromBirthday(k.birthday))),
              budget,
              distance,
              setting,
              interests,
              includeFood,
              includeLunch,
              stops: windowHrs >= 4 ? 3 : windowHrs >= 2 ? 2 : 1,
              startHour,
              endHour: napAware ? Math.min(endHour, napHour) : endHour,
              napHour: napAware ? napHour : null,
            })
          }
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-white font-semibold text-[16px] mt-2"
          style={{ background: "var(--cta)" }}
        >
          <Sparkles size={19} />
          Build my itinerary
        </button>
      </div>
    </div>
  );
}

function ItineraryScreen({
  items, onBack, setSelectedPlace, favorites, toggleFavorite,
  onShare, onInvite, homeBy, napHour, onSave, saved, weatherSwap, onWeatherSwap,
  onComplete, completed, onReshuffle,
}) {
  const [packChecked, setPackChecked] = useState({});
  const packing = packingFor(items);
  const napConflict = napHour != null && items.some((it) => it.time >= napHour);
  const lastStop = items.length ? items[items.length - 1].time : 0;

  return (
    <div className="pb-8">
      <TopBar
        title="Your Little Day"
        onBack={onBack}
        right={
          <div className="flex items-center gap-1.5">
            <button onClick={onReshuffle} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold text-white" style={{ background: "var(--cta)" }}>
              <Shuffle size={13} /> Reshuffle
            </button>
            <button onClick={onSave} className="p-1" style={{ color: saved ? "var(--accent)" : "#1B2A4A" }}>
              <Bookmark size={20} fill={saved ? "var(--accent)" : "none"} />
            </button>
          </div>
        }
      />
      <div className="px-5">
        <div
          className="rounded-2xl p-4 mb-2 flex flex-col items-center"
          style={{ backgroundColor: "#FFF8EE" }}
        >
          <SunriseArc items={items} onSelect={setSelectedPlace} />
          <p className="text-[12px] text-[#B08A5A] -mt-2">Tap a stop on the arc for details</p>
        </div>

        {napConflict && (
          <div className="rounded-2xl p-3.5 mt-3 flex items-start gap-2.5" style={{ backgroundColor: "#F3EEFB" }}>
            <Moon size={17} color="#7A5EA8" className="mt-0.5 shrink-0" />
            <p className="text-[13px] text-[#5C4B72] leading-snug">
              Heads up — part of this plan runs past nap time ({formatHour(napHour)}). Consider trimming the last stop or heading home a little earlier.
            </p>
          </div>
        )}

        {weatherSwap && (
          <div className="rounded-2xl p-3.5 mt-3" style={{ backgroundColor: "#EAF1F6" }}>
            <div className="flex items-start gap-2.5">
              <CloudRain size={17} color="#3E7CA8" className="mt-0.5 shrink-0" />
              <p className="text-[13px] text-[#3A5A72] leading-snug">
                Rain may roll in around {formatHour(WEATHER.rainRiskAfter)}. Want to swap{" "}
                <span className="font-semibold">{weatherSwap.from.name}</span> for the indoor{" "}
                <span className="font-semibold">{weatherSwap.to.name}</span>?
              </p>
            </div>
            <button
              onClick={onWeatherSwap}
              className="mt-2.5 w-full rounded-xl py-2.5 flex items-center justify-center gap-1.5 font-semibold text-[13px]"
              style={{ backgroundColor: "#3E7CA8", color: "#fff" }}
            >
              <Cloud size={15} /> Swap to indoor
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          {items.map((item, i) => (
            <div key={item.place.id} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className="text-[12px] font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#1B2A4A", color: "#FFFBF5" }}
                >
                  {formatHour(item.time)}
                </span>
                {i < items.length - 1 && (
                  <div className="w-[2px] flex-1 my-1" style={{ backgroundColor: "#EFEAE0" }} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <PlaceCard
                  place={item.place}
                  onSelect={setSelectedPlace}
                  favorited={favorites.includes(item.place.id)}
                  onToggleFavorite={toggleFavorite}
                />
                {isClassBased(item.place) && (
                  <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: "#5B6B8C" }}>
                    <CalendarDays size={11} /> No drop-ins — class sign-up required{classInfo(item.place)?.freeTrial ? " · free trial available" : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
          {homeBy != null && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className="text-[12px] font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#F5B71F", color: "#1B2A4A" }}
                >
                  {formatHour(homeBy)}
                </span>
              </div>
              <div className="flex-1 pb-2 flex items-center">
                <p className="text-[14px] font-medium text-[#1B2A4A]">🏠 Home sweet home</p>
              </div>
            </div>
          )}
        </div>

        {!completed ? (
          <button
            onClick={onComplete}
            className="w-full rounded-2xl py-3.5 mt-5 flex items-center justify-center gap-2 text-white font-semibold text-[15px]"
            style={{ background: "var(--cta)" }}
          >
            🎉 We did it!
          </button>
        ) : (
          <div className="w-full rounded-2xl py-3.5 mt-5 flex items-center justify-center gap-2 font-semibold text-[15px]" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>
            <Check size={17} /> Day completed
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={onShare}
            className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-1.5 text-white font-semibold text-[14px]"
            style={{ background: "var(--cta)" }}
          >
            <Share2 size={16} /> Share
          </button>
          <button
            onClick={onInvite}
            className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-1.5 font-semibold text-[14px] border"
            style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}
          >
            <CalendarDays size={16} /> Play date
          </button>
        </div>

        <div className="rounded-2xl p-4 mt-5" style={{ backgroundColor: "#FFF8EE" }}>
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2.5">🎒 Packing for today</p>
          <div className="flex flex-col gap-2">
            {packing.map((item) => {
              const on = packChecked[item];
              return (
                <button
                  key={item}
                  onClick={() => setPackChecked((c) => ({ ...c, [item]: !c[item] }))}
                  className="flex items-center gap-2.5 text-left"
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: on ? "var(--accent)" : "#fff",
                      borderColor: on ? "var(--accent)" : "#D8D1C2",
                    }}
                  >
                    {on && <Check size={13} color="#fff" strokeWidth={3} />}
                  </span>
                  <span
                    className="text-[14px]"
                    style={{ color: on ? "#B8B0A0" : "#5C5648", textDecoration: on ? "line-through" : "none" }}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const KATONAH = { lat: 41.256, lng: -73.686 };

function PlaceholderMap({ places, onSelect, note }) {
  return (
    <div className="w-full h-full relative" style={{ backgroundColor: "#EAF2ED" }}>
      {places.map((p, i) => {
        const left = 12 + ((i * 37) % 80);
        const top = 15 + ((i * 53) % 70);
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-base shadow"
            style={{ left: `${left}%`, top: `${top}%`, backgroundColor: "var(--accent)" }}
          >
            {categoryIcon(p)}
          </button>
        );
      })}
      <div className="absolute bottom-2 right-2 text-[10px] text-[#8A8474] bg-white/80 px-2 py-1 rounded-full">
        {note}
      </div>
    </div>
  );
}

function GoogleMapView({ places, located, userCoords, onSelect }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "little-day-gmaps",
    googleMapsApiKey: GMAPS_KEY,
    libraries: GMAPS_LIBRARIES,
  });

  if (loadError) {
    return <PlaceholderMap places={places} onSelect={onSelect} note="map couldn't load — check your API key" />;
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#EAF2ED" }}>
        <span className="text-[12px] text-[#8A8474]">Loading map…</span>
      </div>
    );
  }

  const center = located && userCoords ? userCoords : KATONAH;
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={located ? 12 : 10}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {places.map((p) => {
        const pos = placeCoords(p);
        if (!pos) return null;
        return (
          <Marker
            key={p.id}
            position={pos}
            title={`${p.name} · ${p.category}`}
            onClick={() => onSelect(p)}
            label={{ text: categoryIcon(p), fontSize: "18px" }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: "#FFFFFF",
              fillOpacity: 1,
              strokeColor: "#FF8C61",
              strokeWeight: 2,
            }}
          />
        );
      })}
      {located && userCoords && (
        <Marker
          position={userCoords}
          title="You"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#3E7CA8",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  );
}

function MapView({ places, located, userCoords, onSelect }) {
  if (!GMAPS_KEY) {
    return (
      <PlaceholderMap
        places={places}
        onSelect={onSelect}
        note="add a Google Maps key to see the live map"
      />
    );
  }
  return <GoogleMapView places={places} located={located} userCoords={userCoords} onSelect={onSelect} />;
}

function MapScreen({ setSelectedPlace, favorites, toggleFavorite, location, onRequestLocation, initialQuery }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState(initialQuery || "");
  const filtered = useMemo(() => {
    let list = filter === "all" ? PLACES : PLACES.filter((p) => primaryGroup(p) === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.town.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, query]);
  const located = location.status === "located";
  return (
    <div className="pb-4">
      <TopBar title="Categories List" hideHome={false} />
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 border bg-white" style={{ borderColor: "#E7E1D4" }}>
          <Search size={17} color="#9C9484" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places, towns, or type"
            className="flex-1 text-[14px] outline-none bg-transparent text-[#1B2A4A]"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={16} color="#9C9484" />
            </button>
          )}
        </div>
      </div>
      <div className="px-5 mb-3">
        <button
          onClick={onRequestLocation}
          disabled={location.status === "locating"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border"
          style={{
            borderColor: located ? "var(--accent)" : "#E7E1D4",
            color: located ? "var(--accent)" : "#5C5648",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Navigation size={15} />
          {location.status === "locating"
            ? "Locating…"
            : located
            ? "Centered on you"
            : "Use my location"}
        </button>
      </div>
      <div className="px-5 mb-3 flex gap-2 overflow-x-auto">
        {[
          { k: "all", l: "All" },
          ...PRIMARY_GROUPS.map((g) => ({ k: g.k, l: g.l.split(" ")[0] })),
        ].map((f) => (
          <Pill key={f.k} active={filter === f.k} onClick={() => setFilter(f.k)}>
            {f.l}
          </Pill>
        ))}
      </div>

      <div className="mx-5 rounded-2xl relative overflow-hidden" style={{ height: 240 }}>
        <MapView
          places={filtered}
          located={located}
          userCoords={location.coords}
          onSelect={setSelectedPlace}
        />
      </div>

      <div className="px-5 mt-4 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-[13px] text-[#8A8474] text-center py-4">
            No places match{query ? ` “${query}”` : " that filter"}. Try a different search or filter.
          </p>
        )}
        {PRIMARY_GROUPS.map((g) => {
          const inGroup = filtered.filter((p) => primaryGroup(p) === g.k);
          if (!inGroup.length) return null;
          return (
            <div key={g.k}>
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className="text-[17px]">{CATEGORY_ICON[g.cats[0]] || "📍"}</span>
                <p className="text-[14px] font-semibold text-[#1B2A4A]">{g.l}</p>
                <span className="text-[11.5px]" style={{ color: "#B8B0A0" }}>{inGroup.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {inGroup.map((p) => (
                  <PlaceCard
                    key={p.id}
                    place={p}
                    onSelect={setSelectedPlace}
                    favorited={favorites.includes(p.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FavoritesScreen({ favorites, setSelectedPlace, toggleFavorite, savedDays, onLoadDay, onDeleteDay }) {
  const list = PLACES.filter((p) => favorites.includes(p.id));
  return (
    <div className="pb-4">
      <TopBar title="Saved" />

      <div className="px-5">
        <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Saved days</p>
        {savedDays.length === 0 && (
          <p className="text-[13px] text-[#8A8474] mb-4">
            No saved days yet. Build a plan and tap the bookmark to keep it here.
          </p>
        )}
        <div className="flex flex-col gap-2.5 mb-6">
          {savedDays.map((day) => (
            <div key={day.id} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[14px] font-semibold text-[#1B2A4A]">{day.title}</p>
                <button onClick={() => onDeleteDay(day.id)} className="p-1">
                  <X size={15} color="#B8B0A0" />
                </button>
              </div>
              <p className="text-[12px] text-[#8A8474] mb-2.5">
                {day.stops.map((s) => PLACES.find((p) => p.id === s.placeId)?.photo).join(" ")} ·{" "}
                {day.stops.length} stop{day.stops.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => onLoadDay(day.stops)}
                className="w-full rounded-xl py-2.5 flex items-center justify-center gap-1.5 font-medium text-[13px] border"
                style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}
              >
                <Sparkles size={14} /> Do this day again
              </button>
            </div>
          ))}
        </div>

        <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Saved places</p>
        <div className="flex flex-col gap-2.5">
          {list.length === 0 && (
            <p className="text-[13px] text-[#8A8474]">
              Nothing saved yet. Tap the heart on any place to keep it here.
            </p>
          )}
          {list.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              onSelect={setSelectedPlace}
              favorited
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ onOpenPremium, onOpenPassport, stats, session, onOpenAuth, onSignOut, earnedBadges, kids, activeKidId, onSetActive, onAddKid, onEditKid, sitters, onAddSitter, onEditSitter, onShareWithSitter,
  profileNames, onSaveProfileNames, myCaregivers, caregiverLinks, caregiverInvite, onCreateCaregiverInvite, onRemoveCaregiverAccess, activeFamilyId, onSwitchFamily,
  favorites, savedDays, onViewSaved, forceEditNameToken,
}) {
  const activeKid = kids.find((k) => k.id === activeKidId) || kids[0] || null;
  const [nameForm, setNameForm] = useState(profileNames || { firstName: "", lastName: "", handle: "" });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [editingName, setEditingName] = useState(false);
  const hasSavedName = !!(profileNames && (profileNames.firstName || profileNames.lastName || profileNames.handle));
  useEffect(() => { setNameForm(profileNames || { firstName: "", lastName: "", handle: "" }); }, [profileNames]);
  useEffect(() => { if (forceEditNameToken) setEditingName(true); }, [forceEditNameToken]);
  return (
    <div className="pb-4">
      <TopBar title="My Profile" />
      <div className="px-5">
        <button
          onClick={onViewSaved}
          className="w-full rounded-2xl p-4 bg-white border mb-3 text-left flex items-center gap-3"
          style={{ borderColor: "#EFEAE0" }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>❤️</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-[#1B2A4A]">Saved places & days</p>
            <p className="text-[11.5px] text-[#8A8474]">{favorites.length} favorite{favorites.length === 1 ? "" : "s"} · {savedDays.length} saved day{savedDays.length === 1 ? "" : "s"}</p>
          </div>
          <span className="text-[12px] font-medium shrink-0" style={{ color: "var(--accent)" }}>View →</span>
        </button>
        <div className="rounded-2xl p-4 bg-white border mb-3" style={{ borderColor: session ? "#CDE8D6" : "#EFEAE0", backgroundColor: session ? "#F4FBF6" : "#FFFFFF" }}>
          {session ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]" style={{ backgroundColor: "#E4F4E9" }}>☁️</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-[#1B2A4A]">Synced to your account</p>
                <p className="text-[11.5px] text-[#8A8474] truncate">{session.user.email} · kids, favorites & days follow you</p>
              </div>
              <button onClick={onSignOut} className="text-[12px] font-semibold shrink-0" style={{ color: "#8A8474" }}>Sign out</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]" style={{ backgroundColor: "#FFF3E6" }}>☁️</div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[#1B2A4A]">Back up & sync your family</p>
                <p className="text-[11.5px] text-[#8A8474]">Sign in so kids & favorites follow you to any device</p>
              </div>
              <button onClick={onOpenAuth} className="text-[12px] font-bold px-3 py-2 rounded-full text-white shrink-0" style={{ background: "var(--cta)" }}>Sign in</button>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-white border mb-3" style={{ borderColor: "#EFEAE0" }}>
          <p className="font-semibold text-[#1B2A4A] mb-1">Your name & username</p>
          <p className="text-[11.5px] text-[#8A8474] mb-3">So other parents can find and add you as a friend.</p>
          {session ? (
            hasSavedName && !editingName ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ backgroundColor: "#F7F4EC" }}>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#1B2A4A] truncate">
                    {[profileNames.firstName, profileNames.lastName].filter(Boolean).join(" ") || "No name set"}
                  </p>
                  {profileNames.handle && <p className="text-[12px] text-[#8A8474] truncate">@{profileNames.handle}</p>}
                </div>
                <button
                  onClick={() => { setNameForm(profileNames); setNameMsg(""); setEditingName(true); }}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0"
                  style={{ color: "var(--accent)", backgroundColor: "#FFF3E6" }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <input value={nameForm.firstName} onChange={(e) => setNameForm({ ...nameForm, firstName: e.target.value })} placeholder="First name"
                    className="flex-1 min-w-0 rounded-xl px-3 py-2 text-[14px] border outline-none" style={{ borderColor: "#E7E1D4" }} />
                  <input value={nameForm.lastName} onChange={(e) => setNameForm({ ...nameForm, lastName: e.target.value })} placeholder="Last name"
                    className="flex-1 min-w-0 rounded-xl px-3 py-2 text-[14px] border outline-none" style={{ borderColor: "#E7E1D4" }} />
                </div>
                <input value={nameForm.handle} onChange={(e) => setNameForm({ ...nameForm, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} placeholder="Username (optional, e.g. essiek)"
                  className="w-full rounded-xl px-3 py-2 text-[14px] border outline-none mb-2" style={{ borderColor: "#E7E1D4" }} />
                <div className="flex gap-2">
                  {hasSavedName && (
                    <button
                      onClick={() => { setNameForm(profileNames); setNameMsg(""); setEditingName(false); }}
                      className="flex-1 rounded-xl py-2.5 font-semibold text-[13px] border"
                      style={{ borderColor: "#E7E1D4", color: "#8A8474" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setNameSaving(true);
                      const r = await onSaveProfileNames(nameForm);
                      setNameMsg(r.message);
                      setNameSaving(false);
                      if (r.ok) setEditingName(false);
                    }}
                    className="flex-1 rounded-xl py-2.5 text-white font-semibold text-[13px]"
                    style={{ background: "var(--cta)" }}
                  >
                    {nameSaving ? "Saving…" : "Save"}
                  </button>
                </div>
                {nameMsg && <p className="text-[11.5px] text-center mt-2" style={{ color: "#8A8474" }}>{nameMsg}</p>}
              </>
            )
          ) : (
            <button onClick={onOpenAuth} className="w-full rounded-xl py-2.5 text-white font-semibold text-[13px]" style={{ background: "var(--cta)" }}>
              Sign in to set your name
            </button>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-white border mb-3" style={{ borderColor: "#EFEAE0" }}>
            <p className="font-semibold text-[#1B2A4A] mb-1">Family Circle</p>
            <p className="text-[11.5px] text-[#8A8474] mb-3">Give a co-parent, grandparent, or nanny their own sign-in that shares your kids, favorites, and plans.</p>

            {caregiverLinks && caregiverLinks.length > 0 && (
              <div className="mb-3">
                <p className="text-[12px] font-semibold text-[#1B2A4A] mb-1.5">Families you can help plan for</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onSwitchFamily(null)}
                    className="text-left p-2 rounded-xl border text-[13px]"
                    style={{ borderColor: !activeFamilyId ? "var(--accent)" : "#EFEAE0", backgroundColor: !activeFamilyId ? "#FFF6F0" : "#fff" }}
                  >
                    Your own family {!activeFamilyId && "· viewing"}
                  </button>
                  {caregiverLinks.map((link) => {
                    const p = link.profiles || {};
                    const label = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || "A family";
                    const active = activeFamilyId === link.owner_id;
                    return (
                      <button
                        key={link.id}
                        onClick={() => onSwitchFamily(link.owner_id)}
                        className="text-left p-2 rounded-xl border text-[13px]"
                        style={{ borderColor: active ? "var(--accent)" : "#EFEAE0", backgroundColor: active ? "#FFF6F0" : "#fff" }}
                      >
                        {label}'s family {active && "· viewing"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {myCaregivers && myCaregivers.length > 0 && (
              <div className="mb-3">
                <p className="text-[12px] font-semibold text-[#1B2A4A] mb-1.5">People who can help plan for your kids</p>
                <div className="flex flex-col gap-1.5">
                  {myCaregivers.map((m) => {
                    const p = m.profiles || {};
                    const label = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || "A caregiver";
                    return (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: "#F7F4EC" }}>
                        <p className="text-[13px] text-[#1B2A4A]">{label}</p>
                        <button onClick={() => onRemoveCaregiverAccess(m.id)} className="text-[11.5px] font-semibold" style={{ color: "#C0604B" }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {session ? (
              caregiverInvite ? (
                <div className="rounded-xl p-3" style={{ backgroundColor: "#FFF3E6" }}>
                  <p className="text-[12px] text-[#8A8474] mb-1.5">Share this link — they'll sign in, set up their name, and get access:</p>
                  <p className="text-[12.5px] font-mono break-all text-[#1B2A4A] mb-2">{caregiverInvite.link}</p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(caregiverInvite.link); }}
                    className="w-full rounded-xl py-2 text-white font-semibold text-[13px]"
                    style={{ background: "var(--cta)" }}
                  >
                    Copy link
                  </button>
                </div>
              ) : (
                <button onClick={onCreateCaregiverInvite} className="w-full rounded-xl py-2.5 border font-semibold text-[13px]" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                  + Invite a caregiver
                </button>
              )
            ) : (
              <button onClick={onOpenAuth} className="w-full rounded-xl py-2.5 text-white font-semibold text-[13px]" style={{ background: "var(--cta)" }}>
                Sign in to invite a caregiver
              </button>
            )}
          </div>

        <div className="rounded-2xl p-4 bg-white border" style={{ borderColor: "#EFEAE0" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-[#1B2A4A]">Children</p>
            <button onClick={onAddKid} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}><Plus size={14} /> Add</button>
          </div>
          {kids.length === 0 ? (
            <p className="text-[13px] text-[#8A8474]">No kids yet — tap Add to create a profile.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {kids.map((k) => {
                const active = k.id === activeKidId;
                return (
                  <div key={k.id} onClick={() => onSetActive(k.id)} className="shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-2xl border cursor-pointer"
                    style={{ borderColor: active ? "var(--accent)" : "#EFEAE0", backgroundColor: active ? "#FFF6F0" : "#fff", minWidth: 78 }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-[22px]" style={{ backgroundColor: "#FFF3E6" }}>{k.emoji}</div>
                    <span className="text-[12px] font-medium text-[#1B2A4A] max-w-[66px] truncate">{k.name || "No name"}</span>
                    <span className="text-[11px] text-[#8A8474]">{ageFromBirthday(k.birthday) === "" ? "Add birthday" : `Age ${ageFromBirthday(k.birthday)}`}</span>
                    <span onClick={(e) => { e.stopPropagation(); onEditKid(k); }} className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>Edit</span>
                  </div>
                );
              })}
            </div>
          )}
          {activeKid && (
            <p className="text-[12px] text-[#8A8474] mt-3">
              Planning for <span className="font-semibold text-[#1B2A4A]">{activeKid.name || "your child"}</span>{ageFromBirthday(activeKid.birthday) !== "" ? `, age ${ageFromBirthday(activeKid.birthday)}` : ""}.
            </p>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-white border mt-3" style={{ borderColor: "#EFEAE0" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-[#1B2A4A]">Caregivers</p>
            <button onClick={onAddSitter} className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}><Plus size={14} /> Add</button>
          </div>
          {sitters.length === 0 ? (
            <p className="text-[13px] text-[#8A8474]">Keep your trusted caregivers handy — tap Add to save one.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sitters.map((st) => (
                <div key={st.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: "#F3F0E8" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[20px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>{st.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#1B2A4A] truncate">{st.name}{st.rate ? <span className="text-[11px] font-normal text-[#8A8474]"> · {st.rate}</span> : null}</p>
                    <p className="text-[11.5px] text-[#8A8474] truncate">{st.notes || st.phone || "No details yet"}</p>
                  </div>
                  {st.phone && (
                    <a href={`tel:${st.phone.replace(/[^0-9+]/g, "")}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E4F4E9" }}>
                      <Phone size={14} color="#2E8B57" />
                    </a>
                  )}
                  <button onClick={() => onShareWithSitter(st)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#FFF3E6" }} title="Share today's plan">
                    <Share2 size={14} color="#B08A5A" />
                  </button>
                  <button onClick={() => onEditSitter(st)} className="text-[11px] font-medium shrink-0" style={{ color: "var(--accent)" }}>Edit</button>
                </div>
              ))}
              <p className="text-[11px] text-[#B8B0A0]">Tap ↪ to text today's plan — stops, nap time and home-by — to your caregiver.</p>
            </div>
          )}
        </div>

        <button onClick={onOpenPassport} className="w-full rounded-2xl p-4 bg-white border mt-3 text-left" style={{ borderColor: "#EFEAE0" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-[#1B2A4A]">Adventure Passport</p>
            <span className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>View →</span>
          </div>
          <div className="flex gap-4 mb-2.5">
            <div><span className="text-[18px] font-bold text-[#1B2A4A]">{stats.adventures}</span> <span className="text-[12px] text-[#8A8474]">adventures</span></div>
            <div><span className="text-[18px] font-bold text-[#1B2A4A]">{stats.placesVisited}</span> <span className="text-[12px] text-[#8A8474]">places</span></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {earnedBadges.length === 0 ? (
              <span className="text-[12px] text-[#8A8474]">Finish a day and tap “We did it!” to earn your first badge.</span>
            ) : earnedBadges.slice(0, 4).map((b) => (
              <span key={b.id} className="text-[12px] px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FFF3E6" }}>{b.emoji} {b.label}</span>
            ))}
          </div>
        </button>

        <div className="rounded-2xl p-4 mt-3 text-center" style={{ backgroundColor: "#FFF8EE" }}>
          <p className="font-semibold text-[#1B2A4A] text-[14px]">Little Day Premium</p>
          <p className="text-[12px] text-[#8A8474] mt-1">Unlimited planning, vacation mode, offline guides</p>
          <button
            onClick={onOpenPremium}
            className="mt-3 px-5 py-2 rounded-full text-white text-[13px] font-semibold"
            style={{ background: "var(--cta)" }}
          >
            See Premium
          </button>
        </div>
      </div>
    </div>
  );
}

function PremiumScreen({ onBack, onUpgrade }) {
  const [plan, setPlan] = useState("year");
  const monthly = 3.99;
  const yearly = 19.99;

  const premiumFeatures = [
    { icon: "✨", title: "Unlimited AI day planning", desc: "Plan as many days as you like, with smarter, more personalized picks." },
    { icon: "🧳", title: "Vacation & multi-day mode", desc: "Plan a whole weekend or a trip — not just today." },
    { icon: "☀️", title: "Weather & traffic-aware plans", desc: "Real forecasts and drive times so ‘home by nap’ actually holds." },
    { icon: "📶", title: "Offline access", desc: "Your saved days and maps, even with no signal." },
    { icon: "📖", title: "Exclusive local guides", desc: "Seasonal roundups and curated itineraries from local parents." },
    { icon: "🎁", title: "Early access to new features", desc: "Be first to try things like reserving a gift for pickup." },
  ];

  return (
    <div className="pb-10">
      <TopBar title="Little Day Premium" onBack={onBack} />
      <div className="px-5">
        <div className="rounded-3xl p-6 text-center" style={{ background: "linear-gradient(160deg,#FFF3E6,#FFF8EE)" }}>
          <div className="flex justify-center mb-2">
            <LittleDaySun size={64} />
          </div>
          <h2 className="text-[22px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Unlock the full adventure
          </h2>
          <p className="text-[13px] text-[#8A8474] mt-1.5 max-w-[290px] mx-auto">
            Start with 7 days of the full experience, free. After that, keep the free basics forever — or go Premium for just $3.99/month.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2.5">Everything in Free, plus:</p>
          <div className="flex flex-col gap-3">
            {premiumFeatures.map((f) => (
              <div key={f.title} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>
                  {f.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#1B2A4A]">{f.title}</p>
                  <p className="text-[12px] text-[#8A8474] leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={() => setPlan("month")}
            className="flex-1 rounded-2xl p-3.5 border text-left relative"
            style={{ borderColor: plan === "month" ? "var(--accent)" : "#E7E1D4", borderWidth: 2, backgroundColor: "#fff" }}
          >
            <p className="text-[13px] font-semibold text-[#1B2A4A]">Monthly</p>
            <p className="text-[18px] font-bold text-[#1B2A4A] mt-0.5">${monthly}<span className="text-[12px] font-medium text-[#8A8474]">/mo</span></p>
          </button>
          <button
            onClick={() => setPlan("year")}
            className="flex-1 rounded-2xl p-3.5 border text-left relative"
            style={{ borderColor: plan === "year" ? "var(--accent)" : "#E7E1D4", borderWidth: 2, backgroundColor: "#fff" }}
          >
            <span className="absolute -top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--cta)" }}>
              BEST VALUE
            </span>
            <p className="text-[13px] font-semibold text-[#1B2A4A]">Yearly</p>
            <p className="text-[18px] font-bold text-[#1B2A4A] mt-0.5">${yearly}<span className="text-[12px] font-medium text-[#8A8474]">/yr</span></p>
          </button>
        </div>

        <button
          onClick={onUpgrade}
          className="w-full rounded-2xl py-4 mt-4 flex items-center justify-center gap-2 text-white font-semibold text-[16px]"
          style={{ background: "var(--cta)" }}
        >
          <Sparkles size={18} /> Start 7-day free trial
        </button>
        <p className="text-center text-[12px] text-[#8A8474] mt-2.5">
          Then {plan === "year" ? `$${yearly}/year` : `$${monthly}/month`} · Cancel anytime
        </p>

        <div className="rounded-2xl p-3.5 mt-5 flex items-start gap-2.5" style={{ backgroundColor: "#F0EEE6" }}>
          <Sparkles size={15} color="#8A8474" className="mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#8A8474] leading-snug">
            This is a preview of how Premium will work — no payment is set up yet and you won't be charged. Subscriptions arrive once the app is live with accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlaceDetailScreen({ place, onBack, favorited, onToggleFavorite, checkInCount, onCheckIn, surpriseMode, onSurpriseAgain, onSelectPlace }) {
  const { reviews, addReview } = useContext(ReviewsContext);
  const [myStars, setMyStars] = useState(0);
  const [myText, setMyText] = useState("");
  if (!place) return null;
  const stats = reviewStats(reviews, place.id);
  const list = reviews[place.id] || [];
  const submit = () => {
    if (!myStars) return;
    addReview(place.id, myStars, myText);
    setMyStars(0);
    setMyText("");
  };
  const yn = (v, yes, no) => (v === null || v === undefined ? "Not yet rated" : v ? yes : no);
  const txt = (v) => (v === null || v === undefined || v === "" ? "Not yet rated" : v);
  const rows = [
    { icon: MapPin, label: "Address", value: txt(place.address) },
    { icon: Users, label: "Right now", value: txt(place.crowd) },
    { icon: Trees, label: "Shade", value: txt(place.shade) },
    { icon: ParkingCircle, label: "Parking", value: txt(place.parking) },
    { icon: Baby, label: "Changing table", value: yn(place.changingTable, "Yes", "Not available") },
    { icon: Accessible, label: "Stroller friendly", value: yn(place.stroller, "Yes", "Limited") },
    { icon: Utensils, label: "Food on site", value: yn(place.food, "Yes", "Bring your own") },
  ];

  return (
    <div className="pb-8">
      <TopBar
        title={place.category}
        onBack={onBack}
        right={surpriseMode ? (
          <button
            onClick={onSurpriseAgain}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white"
            style={{ background: "var(--cta)" }}
          >
            🎲 Again
          </button>
        ) : null}
      />
      {surpriseMode && (
        <p className="px-5 -mt-1 mb-1 text-[12px] text-[#B08A5A]">Not feeling it? Tap “Again” for another idea.</p>
      )}
      <div className="px-5">
        <div
          className="rounded-2xl h-40 flex items-center justify-center text-6xl mb-4"
          style={{ backgroundColor: "#FFF3E6" }}
        >
          {place.photo}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[21px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {place.name}
            </h2>
            <p className="text-[13px] text-[#8A8474] mt-0.5">
              {place.town} · {place.distanceMi} mi · Ages {place.ageRange}
            </p>
            {stats.count > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Stars value={stats.avg} size={15} />
                <span className="text-[12px] text-[#8A8474]">
                  {stats.avg.toFixed(1)} · {stats.count} review{stats.count !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <PriceBadge price={place.price} detail />
              <OpenNowBadge place={place} nowHour={currentHour()} />
              <HoursChip place={place} size="lg" />
            </div>
            {placeHours(place) && (
              <p className="text-[12px] text-[#B8B0A0] mt-1.5 italic">
                Approx hours {formatHour(placeHours(place)[0])}–{formatHour(placeHours(place)[1])} · verify before you go
              </p>
            )}
          </div>
          <button onClick={() => onToggleFavorite(place.id)} className="p-2">
            <Heart size={22} color={favorited ? "var(--accent)" : "#C9C2B2"} fill={favorited ? "var(--accent)" : "none"} />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="w-full rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-white font-medium text-[14px]"
            style={{ backgroundColor: "#1B2A4A" }}
          >
            <Navigation size={16} /> Directions
          </button>
        </div>

        {isClassBased(place) && (
          <div className="rounded-2xl p-4 mt-3 border" style={{ borderColor: "#DCE0EA", backgroundColor: "#F3F5F9" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarDays size={15} color="#5B6B8C" />
              <span className="text-[13px] font-semibold" style={{ color: "#3D4A66" }}>Classes & lessons — no drop-ins</span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: "#5B6B8C" }}>This spot runs on registration, so you can't just walk in — sign up for a class or program to attend.</p>
            {classInfo(place)?.freeTrial === true ? (
              <p className="text-[12px] font-semibold mt-2" style={{ color: "#2E8B57" }}>✨ Free trial class available — worth a call!</p>
            ) : (
              <p className="text-[12px] mt-2" style={{ color: "#8A8474" }}>Tip: ask if they offer a free trial class.</p>
            )}
            {place.website && (
              <a
                href={`https://${place.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white"
                style={{ backgroundColor: "#3D4A66" }}
              >
                Pricing &amp; sign-up →
              </a>
            )}
          </div>
        )}

        {foodInfo(place) && (
          <div className="rounded-2xl p-4 mt-3 border" style={{ borderColor: "#F0E4D4", backgroundColor: "#FFFDF8" }}>
            <p className="text-[13px] font-semibold mb-2" style={{ color: "#B08A5A" }}>Food &amp; dietary</p>
            <p className="text-[13px] text-[#1B2A4A] font-medium">{foodInfo(place).cuisine}</p>
            <p className="text-[12px] text-[#8A8474] mb-2">{foodInfo(place).dishes}</p>
            <div className="flex gap-1.5 flex-wrap">
              {foodInfo(place).gf === true && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Gluten-free options</span>}
              {foodInfo(place).veg === true && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Vegetarian</span>}
              {foodInfo(place).vegan === true && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Vegan</span>}
              {foodInfo(place).gf === null && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EEE6", color: "#5C5648" }}>Ask about gluten-free</span>}
            </div>
            {foodInfo(place).note && <p className="text-[12px] mt-2" style={{ color: "#8A8474" }}>{foodInfo(place).note}</p>}
            <p className="text-[11px] mt-2" style={{ color: "#B8B0A0" }}>Parent-reported — always call ahead for serious allergies.</p>
          </div>
        )}

        {marketFood(place) && (
          <div className="rounded-2xl p-4 mt-3 border" style={{ borderColor: "#F0E4D4", backgroundColor: "#FFFDF8" }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: "#B08A5A" }}>Food at this market</p>
            <div className="flex gap-1.5 flex-wrap mb-1.5">
              {marketFood(place).vendors === true ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Prepared food vendors</span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0EEE6", color: "#5C5648" }}>Produce-focused</span>
              )}
            </div>
            <p className="text-[12px]" style={{ color: "#8A8474" }}>{marketFood(place).note}</p>
          </div>
        )}

        <div className="rounded-2xl p-4 mt-3 border" style={{ borderColor: "#F0E4D4", backgroundColor: "#FFF8EE" }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-semibold text-[#1B2A4A]">Check in &amp; earn rewards</p>
            {Math.floor((checkInCount || 0) / 5) > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>
                🎁 {Math.floor((checkInCount || 0) / 5)} earned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: i < ((checkInCount || 0) % 5) ? "var(--accent)" : "#F0EADD" }}>
                {i < ((checkInCount || 0) % 5) && <Check size={13} color="#fff" strokeWidth={3} />}
              </span>
            ))}
          </div>
          <p className="text-[12px] text-[#8A8474] mb-3">
            {(checkInCount || 0) > 0 && (checkInCount || 0) % 5 === 0
              ? "Reward ready! Check in again to start your next."
              : `${5 - ((checkInCount || 0) % 5)} more until a free treat`}
            {(checkInCount || 0) > 0 ? ` · ${checkInCount} total` : ""}
          </p>
          <button onClick={onCheckIn} className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
            <MapPin size={16} /> I'm here — check in
          </button>
          <p className="text-[11px] text-[#B8B0A0] mt-2 text-center">Location-verified &amp; redeemable with partner spots in the live app.</p>
        </div>

        <div className="rounded-2xl p-4 mt-4" style={{ backgroundColor: "#FFF8EE" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={15} color="#B08A5A" />
            <span className="text-[12px] font-semibold" style={{ color: "#B08A5A" }}>
              About this place
            </span>
          </div>
          <p className="text-[14px] text-[#5C5648] leading-relaxed">{place.blurb}</p>
          {place.website && (
            <p className="text-[12px] mt-2" style={{ color: "#B08A5A" }}>
              {place.website}
            </p>
          )}
        </div>

        {placePerks(place).length > 0 && (
          <div className="rounded-2xl p-4 mt-3" style={{ backgroundColor: "#FFF3E6" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[14px]">🖍️</span>
              <span className="text-[12px] font-semibold" style={{ color: "#B08A5A" }}>For children</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {placePerks(place).map((k) => (
                <span key={k} className="text-[12px] px-2.5 py-1 rounded-full bg-white text-[#5C5648] border" style={{ borderColor: "#F0E4D4" }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {rows.map((r) => {
            const unrated = r.value === "Not yet rated";
            return (
              <div key={r.label} className="flex items-center gap-3">
                <r.icon size={18} color="#8A8474" />
                <span className="text-[13px] text-[#8A8474] w-32">{r.label}</span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: unrated ? "#B8B0A0" : "#1B2A4A", fontStyle: unrated ? "italic" : "normal" }}
                >
                  {r.value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Report what you're seeing</p>
          <div className="flex gap-2 flex-wrap">
            {["Busy", "Empty", "Bathrooms clean", "Long line", "No parking"].map((r) => (
              <button
                key={r}
                className="text-[12px] px-3 py-1.5 rounded-full border flex items-center gap-1"
                style={{ borderColor: "#EFEAE0", color: "#5C5648" }}
              >
                <CheckCircle2 size={12} /> {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <MessageCircle size={16} color="#1B2A4A" />
            <p className="text-[14px] font-semibold text-[#1B2A4A]">
              Parent reviews{stats.count > 0 ? ` (${stats.count})` : ""}
            </p>
          </div>

          <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#FFF8EE" }}>
            <p className="text-[13px] font-medium text-[#5C5648] mb-2">Been here? Leave a review</p>
            <Stars value={myStars} size={26} onPick={setMyStars} />
            <textarea
              value={myText}
              onChange={(e) => setMyText(e.target.value)}
              placeholder="Share a tip for other parents (optional)"
              rows={2}
              className="w-full mt-3 rounded-xl px-3 py-2.5 text-[14px] border outline-none resize-none"
              style={{ borderColor: "#E7E1D4", backgroundColor: "#FFFFFF" }}
            />
            <button
              onClick={submit}
              disabled={!myStars}
              className="w-full rounded-xl py-2.5 mt-2 flex items-center justify-center gap-1.5 text-white font-semibold text-[13px]"
              style={{ background: "var(--cta)", opacity: myStars ? 1 : 0.45 }}
            >
              <Star size={15} /> Post review
            </button>
          </div>

          {list.length === 0 ? (
            <p className="text-[13px] text-[#8A8474]">No reviews yet — be the first to share a tip!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((rv) => (
                <div key={rv.id} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
                  <div className="flex items-center justify-between mb-1">
                    <Stars value={rv.stars} size={13} />
                    <span className="text-[11px] text-[#B8B0A0]">{rv.when}</span>
                  </div>
                  {rv.text && <p className="text-[13px] text-[#5C5648] leading-snug">{rv.text}</p>}
                  <p className="text-[12px] text-[#8A8474] mt-1.5">— {rv.author}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {similarPlaces(place).length > 0 && (
          <div className="mt-7">
            <p className="text-[14px] font-semibold text-[#1B2A4A] mb-2.5">You might also like</p>
            <div className="flex flex-col gap-2.5">
              {similarPlaces(place).map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => onSelectPlace && onSelectPlace(sp)}
                  className="flex gap-3 p-3 rounded-2xl bg-white border text-left items-center"
                  style={{ borderColor: "#EFEAE0" }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>{sp.photo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-[#1B2A4A] truncate">{sp.name}</p>
                    <p className="text-[12px] text-[#8A8474]">{sp.category} · {sp.town} · {sp.distanceMi} mi</p>
                  </div>
                  <ChevronRight size={16} color="#C9C2B2" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <LittleDayLockup sunSize={88} wordSize={44} tagline />
        <p className="text-[16px] font-semibold text-[#1B2A4A] mt-6 leading-snug max-w-[290px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Every other app gives you a piece of the day.
        </p>
        <p className="text-[14px] text-[#8A8474] mt-2.5 leading-relaxed max-w-[290px]">
          Little Day is the first to plan the <span className="font-semibold text-[#5C5648]">whole</span> day with the kids — where to go, eat, play, potty, and everything in between. One app. One tap. One less thing to figure out.
        </p>
      </div>
      <div className="px-6 pb-10">
        <button
          onClick={onStart}
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-white font-semibold text-[16px] shadow-sm"
          style={{ background: "var(--cta)" }}
        >
          <Sparkles size={19} />
          Get started
        </button>
        <p className="text-center text-[12px] text-[#9C9484] mt-3">Free to start · Made for Westchester families</p>
      </div>
    </div>
  );
}

function useGeolocation() {
  const [state, setState] = useState({ status: "idle", coords: null, label: "Westchester, NY" });
  const request = () => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported", label: "Westchester, NY" }));
      return;
    }
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "located",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          label: "your location",
        });
      },
      () => setState((s) => ({ ...s, status: "denied", label: "Westchester, NY" })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
  return { ...state, request };
}

function LocationBar({ location, onRequest }) {
  const { status, coords, label } = location;
  let text;
  if (status === "locating") text = "Locating you…";
  else if (status === "located")
    text = `Showing places near you · ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;
  else if (status === "denied" || status === "unsupported")
    text = "Location off — showing Westchester, NY";
  else text = "Tap to use your location · Westchester, NY";

  return (
    <button onClick={onRequest} className="flex items-center gap-1.5" disabled={status === "locating"}>
      <MapPin size={15} color={status === "located" ? "var(--accent)" : "#B08A5A"} />
      <span className="text-[13px] font-medium text-left" style={{ color: "#B08A5A" }}>
        {text}
      </span>
    </button>
  );
}

function Avatar({ emoji, size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: "#FFF3E6", fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}

function FriendsScreen({ onOpenInvite,
  friends,
  sharedDays,
  playDates,
  onAccept,
  onDecline,
  onUseDay,
  onAddFriend,
  setSelectedPlace,
  session,
  onSearchProfiles,
  onAddRealFriend,
  onOpenChat,
}) {
  const [newName, setNewName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [nameResults, setNameResults] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (!session || nameQuery.trim().length < 2) { setNameResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      onSearchProfiles(nameQuery).then((r) => { setNameResults(r); setSearching(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [nameQuery, session]);
  const incoming = playDates.filter((p) => p.direction === "incoming" && p.status === "pending");
  const upcoming = playDates.filter((p) => p.status === "confirmed" || p.status === "invited");
  const place = (id) => PLACES.find((p) => p.id === id);

  const chatGroups = [];
  const seenGroups = new Set();
  playDates.filter((p) => p.real && p.groupId).forEach((p) => {
    if (seenGroups.has(p.groupId)) {
      const g = chatGroups.find((x) => x.groupId === p.groupId);
      if (g && !g.names.includes(p.friend)) g.names.push(p.friend);
    } else {
      seenGroups.add(p.groupId);
      chatGroups.push({ groupId: p.groupId, names: [p.friend], placeId: p.placeId });
    }
  });

  return (
    <div className="pb-4">
      <TopBar title="Friends & play dates" />

      <div className="px-5 mb-5">
        <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">💬 Chats about your days</p>
        {chatGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {chatGroups.map((g) => {
              const pl = place(g.placeId);
              return (
                <button
                  key={g.groupId}
                  onClick={() => onOpenChat(g.groupId)}
                  className="flex items-center gap-3 p-3 rounded-2xl border text-left"
                  style={{ borderColor: "var(--accent)", backgroundColor: "#FFF6F0" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] shrink-0" style={{ backgroundColor: "#FFFFFF" }}>💬</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#1B2A4A] truncate">With {g.names.join(", ")}</p>
                    <p className="text-[11.5px] text-[#8A8474] truncate">{pl ? pl.name : "Your shared day"} · tap to open chat</p>
                  </div>
                  <ChevronRight size={16} color="#B08A5A" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl border" style={{ borderColor: "#EFEAE0", backgroundColor: "#FAF8F3" }}>
            <p className="text-[12.5px] text-[#8A8474] leading-snug">
              {!session
                ? "Sign in from the Profile tab, then invite a real friend (added by name search) to a day plan — a chat for that group will show up right here."
                : "No active group chats yet. Build a day, tap 'Invite friends to join,' and pick a friend you've added by name search — a chat for that day will appear here once they're invited."}
            </p>
          </div>
        )}
      </div>

      {incoming.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Play date invites</p>
          <div className="flex flex-col gap-2.5">
            {incoming.map((pd) => {
              const pl = place(pd.placeId);
              return (
                <div key={pd.id} className="rounded-2xl p-3.5" style={{ backgroundColor: "#FFF8EE" }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar emoji={pd.friendEmoji} size={34} />
                    <p className="text-[14px] text-[#1B2A4A]">
                      <span className="font-semibold">{pd.friend}</span> invited you
                    </p>
                  </div>
                  <p className="text-[13px] text-[#5C5648] mb-3">
                    {pd.day} · {formatHour(pd.time)} at {pl?.photo} {pl?.name}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(pd.id)}
                      className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-white font-medium text-[13px]"
                      style={{ background: "var(--cta)" }}
                    >
                      <Check size={15} /> Join
                    </button>
                    <button
                      onClick={() => onDecline(pd.id)}
                      className="px-4 rounded-xl py-2.5 flex items-center justify-center gap-1.5 font-medium text-[13px] border"
                      style={{ borderColor: "#E7E1D4", color: "#8A8474" }}
                    >
                      <X size={15} /> Can't
                    </button>
                    {pd.real && pd.groupId && (
                      <button
                        onClick={() => onOpenChat(pd.groupId)}
                        className="px-3 rounded-xl py-2.5 flex items-center justify-center border"
                        style={{ borderColor: "#E7E1D4", color: "#8A8474" }}
                      >
                        💬
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Upcoming play dates</p>
          <div className="flex flex-col gap-2.5">
            {upcoming.map((pd) => {
              const pl = place(pd.placeId);
              return (
                <div key={pd.id} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
                  <div className="flex items-center gap-2.5">
                    <Avatar emoji={pd.friendEmoji} size={34} />
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-[#1B2A4A]">
                        {pl?.photo} {pl?.name}
                      </p>
                      <p className="text-[12px] text-[#8A8474]">
                        With {pd.friend} · {pd.day || "Soon"} · {formatHour(pd.time)}
                      </p>
                    </div>
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0"
                      style={{
                        backgroundColor: pd.status === "confirmed" ? "#E7F3EA" : "#FFF3E6",
                        color: pd.status === "confirmed" ? "#3B7A57" : "#B08A5A",
                      }}
                    >
                      {pd.status === "confirmed" ? "Confirmed" : "Invited"}
                    </span>
                    {pd.real && pd.groupId && (
                      <button onClick={() => onOpenChat(pd.groupId)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F7F4EC" }}>
                        💬
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-5 mb-5">
        <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Days your friends shared</p>
        <div className="flex flex-col gap-3">
          {sharedDays.map((day) => (
            <div key={day.id} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <Avatar emoji={day.byEmoji} size={34} />
                <div>
                  <p className="text-[14px] text-[#1B2A4A]">
                    <span className="font-semibold">{day.by}</span> shared a day
                  </p>
                  <p className="text-[12px] text-[#8A8474]">{day.title}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-3 pl-1">
                {day.stops.map((s) => {
                  const pl = place(s.placeId);
                  return (
                    <button
                      key={s.placeId}
                      onClick={() => pl && setSelectedPlace(pl)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span className="text-[12px] font-medium text-[#B08A5A] w-16">{formatHour(s.time)}</span>
                      <span className="text-[13px] text-[#5C5648]">
                        {pl?.photo} {pl?.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onUseDay(day.stops)}
                className="w-full rounded-xl py-2.5 flex items-center justify-center gap-1.5 font-medium text-[13px] border"
                style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}
              >
                <Sparkles size={14} /> Use this day
              </button>
            </div>
          ))}
          {sharedDays.length === 0 && (
            <p className="text-[13px] text-[#8A8474]">No shared days yet. Share one of yours to get things going!</p>
          )}
        </div>
      </div>

      <div className="px-5">
        <p className="text-[13px] font-semibold text-[#1B2A4A] mb-2">Your friends</p>
        {friends.some((f) => f.demo) && (
          <p className="text-[11.5px] mb-2" style={{ color: "#B08A5A" }}>
            The friends marked "Demo" below are sample profiles to show how this screen works — invite real friends to replace them.
          </p>
        )}
        <div className="flex flex-col gap-2 mb-3">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white border" style={{ borderColor: "#EFEAE0" }}>
              <Avatar emoji={f.emoji} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[14px] font-medium text-[#1B2A4A]">{f.name}</p>
                  {f.demo && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#F0EEE6", color: "#8A8474" }}>DEMO</span>
                  )}
                </div>
                <p className="text-[12px] text-[#8A8474] truncate">
                  {f.kids} · {f.town}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-3.5 mb-2.5 border" style={{ borderColor: "#EFEAE0", backgroundColor: "#FFFDF8" }}>
          <p className="text-[12.5px] font-semibold text-[#1B2A4A] mb-2">Search by name or username</p>
          {session ? (
            <>
              <input
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="First and last name, or @handle"
                className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none"
                style={{ borderColor: "#E7E1D4", backgroundColor: "#FFFFFF" }}
              />
              {searching && <p className="text-[11.5px] text-[#B8B0A0] mt-2">Searching…</p>}
              {!searching && nameQuery.trim().length >= 2 && nameResults.length === 0 && (
                <p className="text-[11.5px] text-[#B8B0A0] mt-2">No one found — check the spelling or ask them to set a username.</p>
              )}
              {nameResults.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {nameResults.map((r) => {
                    const label = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.display_name || r.handle || "Little Day parent";
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-xl" style={{ backgroundColor: "#F7F4EC" }}>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-medium text-[#1B2A4A] truncate">{label}</p>
                          {r.handle && <p className="text-[11.5px] text-[#8A8474] truncate">@{r.handle}</p>}
                        </div>
                        <button
                          onClick={() => { onAddRealFriend(r.id, label); setNameQuery(""); setNameResults([]); }}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-full text-white shrink-0"
                          style={{ background: "var(--cta)" }}
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="text-[11.5px]" style={{ color: "#B8B0A0" }}>Sign in from the Profile tab to search for friends by name.</p>
          )}
        </div>

        <div className="rounded-2xl p-3.5 mb-2.5 border" style={{ borderColor: "#EFEAE0", backgroundColor: "#FFFDF8" }}>
          <p className="text-[12.5px] font-semibold text-[#1B2A4A] mb-2">Add a friend by phone number</p>
          <div className="flex gap-2">
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="(914) 555-0123"
              className="flex-1 rounded-xl px-3.5 py-2.5 text-[14px] border outline-none"
              style={{ borderColor: "#E7E1D4", backgroundColor: "#FFFFFF" }}
            />
            <button
              onClick={() => {
                if (phoneInput.replace(/\D/g, "").length >= 10) {
                  onAddFriend(phoneInput);
                  setPhoneInput("");
                }
              }}
              className="px-4 rounded-xl flex items-center gap-1.5 text-white font-medium text-[13px]"
              style={{ backgroundColor: "#1B2A4A" }}
            >
              <UserPlus size={15} /> Add
            </button>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#B8B0A0" }}>
            Preview only for now — once accounts are fully connected, this will text your friend an invite if they're not on Little Day yet, or connect you instantly if they are.
          </p>
        </div>

        <button
          onClick={onOpenInvite}
          className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-white font-semibold text-[14px] mb-2.5"
          style={{ background: "var(--cta)" }}
        >
          <UserPlus size={16} /> Invite a friend
        </button>
        <p className="text-[11px] text-[#B8B0A0] text-center">Share your link or QR code — they tap it and you're connected.</p>
      </div>
    </div>
  );
}

function FakeQR({ size = 120, seed = 7 }) {
  const n = 13;
  const cell = size / n;
  const cells = [];
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const finder = (r < 4 && c < 4) || (r < 4 && c >= n - 4) || (r >= n - 4 && c < 4);
      const on = finder ? ((r % 3 !== 1 || c % 3 !== 1)) : rand() > 0.52;
      if (on) cells.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell * 0.9} height={cell * 0.9} fill="#1B2A4A" />);
    }
  }
  return <svg width={size} height={size}>{cells}</svg>;
}

function InviteSheet({ open, onClose, onShared, session }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) setCopied(false); }, [open]);
  if (!open) return null;
  const hasRealLink = !!session;
  const link = hasRealLink
    ? `${window.location.origin}${window.location.pathname}?addfriend=${session.user.id}`
    : null;
  const shareText = link
    ? `Join me on Little Day — the app that plans whole days out with the kids! ${link}`
    : "Join me on Little Day — the app that plans whole days out with the kids!";
  const doShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "Join me on Little Day", text: shareText }); onShared(); return; }
    } catch (e) {}
    onShared();
  };
  const doCopy = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch (e) {}
  };
  return (
    <div className="absolute inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-6 pb-8 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />
        <p className="text-[17px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Invite a friend</p>
        <p className="text-[13px] text-[#8A8474] mt-1 max-w-[280px] mx-auto">
          {hasRealLink ? "Send your personal link — when they tap it and sign in, you'll be connected as friends automatically." : "Sign in first to get your personal invite link."}
        </p>

        <div className="flex justify-center my-5">
          <div className="rounded-2xl p-3 border-2" style={{ borderColor: "#F0E4D4", backgroundColor: "#FFFBF5" }}>
            <FakeQR size={128} />
          </div>
        </div>

        {hasRealLink && (
          <div className="rounded-xl px-3.5 py-3 flex items-center justify-between border mb-3" style={{ borderColor: "#E7E1D4", backgroundColor: "#FFF8EE" }}>
            <span className="text-[13px] font-medium text-[#1B2A4A] truncate">{link}</span>
            <button onClick={doCopy} className="text-[12px] font-semibold shrink-0 ml-2" style={{ color: "var(--accent)" }}>{copied ? "Copied!" : "Copy"}</button>
          </div>
        )}

        <button onClick={doShare} disabled={!hasRealLink} className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-white font-semibold text-[14px] disabled:opacity-50" style={{ background: "var(--cta)" }}>
          <Share2 size={16} /> Share invite link
        </button>
        <p className="text-[11px] text-[#B8B0A0] mt-3 leading-snug">The QR code above is a visual only for now — sharing the link (text, email, etc.) is what actually connects you. Friends only ever see what you choose to share.</p>
      </div>
    </div>
  );
}

function GroupChatSheet({ open, groupId, session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!groupId || !backendReady()) return;
    const { data } = await supabase.from("day_plan_messages").select("*").eq("group_id", groupId).order("created_at", { ascending: true });
    if (data) setMessages(data);
  };
  useEffect(() => {
    if (!open || !groupId) return;
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [open, groupId]);

  if (!open) return null;

  const send = async () => {
    const body = text.trim();
    if (!body || !backendReady() || !session) return;
    setSending(true);
    await supabase.from("day_plan_messages").insert({ group_id: groupId, sender_id: session.user.id, body });
    setText("");
    await load();
    setSending(false);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-5 pb-6 max-h-[80%] flex flex-col" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4 shrink-0" />
        <p className="text-[15px] font-semibold text-[#1B2A4A] mb-3 shrink-0">Chat about this day</p>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3">
          {messages.length === 0 && <p className="text-[12.5px] text-[#B8B0A0] text-center mt-4">No messages yet — say hi!</p>}
          {messages.map((m) => {
            const mine = session && m.sender_id === session.user.id;
            return (
              <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] ${mine ? "self-end text-white" : "self-start text-[#1B2A4A]"}`}
                style={{ background: mine ? "var(--cta)" : "#F7F4EC" }}>
                {m.body}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 shrink-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Message the group…"
            className="flex-1 rounded-xl px-3.5 py-2.5 text-[14px] border outline-none"
            style={{ borderColor: "#E7E1D4" }}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="px-4 rounded-xl text-white font-medium text-[13px]" style={{ background: "var(--cta)", opacity: sending || !text.trim() ? 0.5 : 1 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendPickerSheet({ open, friends, onPick, onClose, contextLabel }) {
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);
  if (!open) return null;

  const toggle = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="absolute inset-0 z-20 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full rounded-t-3xl bg-white p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "sheetUp 0.22s ease-out" }}
      >
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />
        <p className="text-[15px] font-semibold text-[#1B2A4A] mb-1">Invite friends to join</p>
        <p className="text-[13px] text-[#8A8474] mb-3">
          {contextLabel ? contextLabel + " · " : ""}Pick one or more families
        </p>
        <div className="flex flex-col gap-2">
          {friends.map((f) => {
            const on = selected.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl border active:scale-[0.99] transition-transform"
                style={{ borderColor: on ? "var(--accent)" : "#EFEAE0", backgroundColor: on ? "#FFF6F0" : "#fff" }}
              >
                <Avatar emoji={f.emoji} size={36} />
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-medium text-[#1B2A4A]">{f.name}</p>
                  <p className="text-[12px] text-[#8A8474]">{f.kids}</p>
                </div>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center border"
                  style={{ backgroundColor: on ? "var(--accent)" : "#fff", borderColor: on ? "var(--accent)" : "#D8D1C2" }}
                >
                  {on && <Check size={14} color="#fff" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <button
          disabled={selected.length === 0}
          onClick={() => onPick(friends.filter((f) => selected.includes(f.id)))}
          className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-1.5 text-white font-semibold text-[14px]"
          style={{ background: "var(--cta)", opacity: selected.length === 0 ? 0.45 : 1 }}
        >
          <Send size={16} />
          {selected.length <= 1 ? "Send invite" : `Send ${selected.length} invites`}
        </button>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-full text-white text-[13px] font-medium shadow-lg"
      style={{ bottom: 84, backgroundColor: "#1B2A4A", animation: "toastIn 0.2s ease-out" }}
    >
      {message}
    </div>
  );
}

function PlanningScreen({ onDone }) {
  const messages = [
    "Checking today's weather…",
    "Finding spots near you…",
    "Fitting it into your window…",
    "Planning your Little Day…",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const cycle = setInterval(() => setIdx((i) => Math.min(i + 1, messages.length - 1)), 480);
    const done = setTimeout(onDone, 2050);
    return () => {
      clearInterval(cycle);
      clearTimeout(done);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-8" style={{ minHeight: "78vh" }}>
      <div style={{ animation: "sunFloat 0.8s ease-out" }}>
        <div style={{ animation: "sunBob 2.4s ease-in-out infinite" }}>
          <div style={{ animation: "raysShimmer 1.6s ease-in-out infinite" }}>
            <LittleDaySun size={104} />
          </div>
        </div>
      </div>
      <p
        className="mt-7 text-[16px] font-semibold text-[#1B2A4A] text-center"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {messages[idx]}
      </p>
      <div className="flex gap-1.5 mt-4">
        {messages.map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: i <= idx ? "var(--accent)" : "#E7E1D4" }}
          />
        ))}
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#FF8C61", "#F5B71F", "#FFC857", "#4E9E63", "#3585A0", "#C85B92"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const dur = 1.8 + Math.random() * 1.3;
        const size = 6 + Math.random() * 6;
        return (
          <span key={i} style={{
            position: "absolute", top: "-20px", left: `${left}%`,
            width: size, height: size * 0.6, backgroundColor: colors[i % colors.length],
            borderRadius: 2, transform: `rotate(${Math.random() * 360}deg)`,
            animation: `confettiFall ${dur}s linear ${delay}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

function CelebrationOverlay({ data, onClose, onPassport, onShare }) {
  if (!data) return null;
  const { record, newBadges } = data;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(27,42,74,0.35)" }} onClick={onClose}>
      <Confetti />
      <div className="relative w-full max-w-[340px] rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "sunFloat 0.4s ease-out" }}>
        <div className="flex justify-center mb-2"><LittleDaySun size={64} /></div>
        <h2 className="text-[22px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Day complete!</h2>
        <p className="text-[13px] text-[#8A8474] mt-1">You earned {record.stops.length} new stamp{record.stops.length !== 1 ? "s" : ""} 🎉</p>
        <div className="flex justify-center gap-2 flex-wrap mt-4">
          {record.stops.map((s, i) => (
            <span key={i} className="w-12 h-12 rounded-full flex items-center justify-center text-[22px]" style={{ backgroundColor: "#FFF3E6", transform: `rotate(${(i % 2 ? 1 : -1) * 6}deg)`, border: "2px dashed #F0C89A" }}>{s.photo}</span>
          ))}
        </div>
        {newBadges.length > 0 && (
          <div className="mt-4 rounded-2xl p-3" style={{ backgroundColor: "#FFF8EE" }}>
            <p className="text-[12px] font-semibold" style={{ color: "#B08A5A" }}>New badge{newBadges.length !== 1 ? "s" : ""} unlocked!</p>
            <div className="flex justify-center gap-2 flex-wrap mt-1.5">
              {newBadges.map((b) => (
                <span key={b.id} className="text-[12px] px-3 py-1.5 rounded-full bg-white border" style={{ borderColor: "#F0E4D4" }}>{b.emoji} {b.label}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => onShare(record)} className="w-full rounded-2xl py-3 mt-5 flex items-center justify-center gap-2 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
          <Share2 size={16} /> Share our day card
        </button>
        <div className="flex gap-2 mt-2">
          <button onClick={onPassport} className="flex-1 rounded-2xl py-2.5 font-semibold text-[13px] border" style={{ borderColor: "#1B2A4A", color: "#1B2A4A" }}>See passport</button>
          <button onClick={onClose} className="flex-1 rounded-2xl py-2.5 font-semibold text-[13px]" style={{ color: "#8A8474" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function DayCardOverlay({ record, onClose, onShared }) {
  if (!record) return null;
  const dt = new Date(record.date);
  const dateStr = dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const items = record.stops.map((s) => ({ place: { id: s.placeId, photo: s.photo }, time: s.time || 0 }));
  const doShare = async () => {
    const text = `Our Little Day (${dateStr}): ${record.stops.map((s) => s.name).join(" → ")}`;
    try { if (navigator.share) { await navigator.share({ title: "Our Little Day", text }); } } catch (e) {}
    onShared && onShared();
  };
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(27,42,74,0.35)" }} onClick={onClose}>
      <div className="relative w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-3xl p-5 text-center" style={{ background: "linear-gradient(160deg,#FFFBF5,#FFF3E6)", border: "1px solid #F0E4D4" }}>
          <div className="flex items-center justify-center gap-2 mb-1"><LittleDaySun size={34} /><LittleDayWordmark size={20} /></div>
          <p className="text-[12px] font-semibold tracking-wide" style={{ color: "#B08A5A" }}>OUR LITTLE DAY</p>
          <p className="text-[13px] text-[#8A8474] mb-1">{dateStr}</p>
          <div className="my-2 flex justify-center"><SunriseArc items={items} onSelect={() => {}} /></div>
          <div className="flex flex-col gap-1 mt-1">
            {record.stops.map((s, i) => (
              <p key={i} className="text-[13px] text-[#5C5648]">{s.photo} {s.name}</p>
            ))}
          </div>
          <p className="text-[11px] mt-3 font-semibold" style={{ color: "#B08A5A" }}>Big Adventures. Little Days.</p>
        </div>
        <button onClick={doShare} className="w-full rounded-2xl py-3 mt-3 flex items-center justify-center gap-2 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
          <Share2 size={16} /> Share
        </button>
        <p className="text-center text-[11px] mt-2" style={{ color: "#FFFFFF" }}>📸 Or screenshot to send to grandma</p>
      </div>
    </div>
  );
}

function RewardOverlay({ data, onClose }) {
  if (!data) return null;
  const { place, number } = data;
  const code = `LD-${(place.id.replace(/[^a-z]/gi, "").slice(0, 3) || "LD").toUpperCase()}${String(number).padStart(2, "0")}`;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(27,42,74,0.35)" }} onClick={onClose}>
      <Confetti />
      <div className="relative w-full max-w-[340px] rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "sunFloat 0.4s ease-out" }}>
        <div className="text-[44px]">🎁</div>
        <h2 className="text-[22px] font-bold text-[#1B2A4A] mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reward unlocked!</h2>
        <p className="text-[13px] text-[#8A8474] mt-1">5 check-ins at {place.name} — nice work!</p>
        <div className="rounded-2xl p-4 mt-4 border-2 border-dashed" style={{ borderColor: "#E7B989", backgroundColor: "#FFF8EE" }}>
          <p className="text-[15px] font-bold text-[#1B2A4A]">Free drink or dessert</p>
          <p className="text-[12px] text-[#8A8474] mt-0.5">Show this at the counter</p>
          <p className="text-[17px] font-bold mt-2" style={{ color: "#B08A5A", letterSpacing: "0.15em" }}>{code}</p>
        </div>
        <p className="text-[11px] text-[#B8B0A0] mt-3 leading-snug">Sample reward. Real perks appear when {place.name} joins Little Day as a partner.</p>
        <button onClick={onClose} className="w-full rounded-2xl py-3 mt-4 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>Awesome</button>
      </div>
    </div>
  );
}

function PassportScreen({ onBack, completedDays, stats, earnedBadges, onShareDay, onAddPhoto }) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const allStamps = completedDays.flatMap((d) => d.stops.map((s) => ({ ...s, date: d.date })));
  return (
    <div className="pb-8">
      <TopBar title="Adventure Passport" onBack={onBack} />
      <div className="px-5">
        <div className="rounded-2xl p-4 flex justify-around text-center" style={{ backgroundColor: "#FFF8EE" }}>
          <div><p className="text-[20px] font-bold text-[#1B2A4A]">{stats.adventures}</p><p className="text-[10px] text-[#8A8474]">Adventures</p></div>
          <div><p className="text-[20px] font-bold text-[#1B2A4A]">{stats.placesVisited}</p><p className="text-[10px] text-[#8A8474]">Places</p></div>
          <div><p className="text-[20px] font-bold text-[#1B2A4A]">{stats.checkInsTotal}</p><p className="text-[10px] text-[#8A8474]">Check-ins</p></div>
          <div><p className="text-[20px] font-bold text-[#1B2A4A] flex items-center justify-center gap-1">{stats.streakWeeks}<Flame size={15} color="#FF8C61" /></p><p className="text-[10px] text-[#8A8474]">Streak</p></div>
        </div>
        {stats.rewardsEarned > 0 && (
          <div className="rounded-2xl p-3 mt-2.5 text-center" style={{ backgroundColor: "#E4F4E9" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#2E8B57" }}>🎁 {stats.rewardsEarned} reward{stats.rewardsEarned !== 1 ? "s" : ""} earned from check-ins</p>
          </div>
        )}

        <p className="text-[13px] font-semibold text-[#1B2A4A] mt-6 mb-2">Badges</p>
        <div className="grid grid-cols-3 gap-2.5">
          {BADGES.map((b) => {
            const on = earnedIds.has(b.id);
            return (
              <div key={b.id} className="rounded-2xl p-3 text-center border" style={{ borderColor: "#EFEAE0", backgroundColor: on ? "#FFF3E6" : "#F7F5EF", opacity: on ? 1 : 0.55 }}>
                <div className="text-[24px]" style={{ filter: on ? "none" : "grayscale(1)" }}>{b.emoji}</div>
                <p className="text-[10.5px] font-medium mt-1" style={{ color: on ? "#1B2A4A" : "#9C9484" }}>{b.label}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[13px] font-semibold text-[#1B2A4A] mt-6 mb-2">Your stamps</p>
        {allStamps.length === 0 ? (
          <p className="text-[13px] text-[#8A8474]">No stamps yet. Finish a day and tap “We did it!” to earn your first.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {allStamps.map((s, i) => (
              <div key={i} className="w-14 h-14 rounded-full flex items-center justify-center text-[24px]" title={s.name} style={{ backgroundColor: "#FFF3E6", border: "2px dashed #E7B989", transform: `rotate(${(i % 3 - 1) * 7}deg)` }}>{s.photo}</div>
            ))}
          </div>
        )}

        {completedDays.length > 0 && (
          <>
            <p className="text-[13px] font-semibold text-[#1B2A4A] mt-6 mb-2">Recent days</p>
            <div className="flex flex-col gap-2.5">
              {completedDays.slice(0, 5).map((d) => (
                <div key={d.id} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
                  {d.memoryPhoto && (
                    <img src={d.memoryPhoto} alt="" className="w-full h-32 object-cover rounded-xl mb-2.5" />
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-[#5C5648]">{d.stops.map((s) => s.photo).join(" ")}</p>
                    <button onClick={() => onShareDay(d)} className="text-[12px] font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}><Share2 size={13} /> Card</button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-[#8A8474]">{new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {d.stops.length} stop{d.stops.length !== 1 ? "s" : ""}</p>
                    <label className="text-[11px] font-medium shrink-0" style={{ color: "var(--accent)" }}>
                      {d.memoryPhoto ? "Change photo" : "+ Add photo"}
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => onAddPhoto(d.id, reader.result);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SitterEditorSheet({ data, onSave, onDelete, onClose }) {
  const [name, setName] = useState(data.name || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [rate, setRate] = useState(data.rate || "");
  const [notes, setNotes] = useState(data.notes || "");
  const EMOJIS = ["🧑", "👩", "👨", "👵", "👴", "⭐"];
  const [emoji, setEmoji] = useState(data.emoji || "🧑");
  return (
    <div className="absolute inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-5 pb-8 max-h-[85%] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />
        <p className="text-[15px] font-semibold text-[#1B2A4A] mb-3">{data.isNew ? "Add a caregiver" : "Edit caregiver"}</p>

        <p className="text-[12px] font-medium text-[#8A8474] mb-2">Avatar</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className="w-11 h-11 rounded-full flex items-center justify-center text-[22px]"
              style={{ backgroundColor: "#FFF3E6", boxShadow: emoji === e ? "0 0 0 3px #fff, 0 0 0 5px var(--accent)" : "none" }}>
              {e}
            </button>
          ))}
        </div>

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah M."
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none mb-4" style={{ borderColor: "#E7E1D4" }} />

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Phone</p>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(914) 555-0123"
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none mb-4" style={{ borderColor: "#E7E1D4" }} />

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Rate (optional)</p>
        <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. $20/hr"
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none mb-4" style={{ borderColor: "#E7E1D4" }} />

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Notes (optional)</p>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. CPR certified, free weekends"
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none mb-5" style={{ borderColor: "#E7E1D4" }} />

        <button onClick={() => onSave({ ...data, name, phone, rate, notes, emoji })}
          className="w-full rounded-2xl py-3.5 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
          {data.isNew ? "Add caregiver" : "Save"}
        </button>
        {!data.isNew && (
          <button onClick={() => onDelete(data.id)} className="w-full rounded-2xl py-3 mt-2 font-semibold text-[13px] flex items-center justify-center gap-1.5" style={{ color: "#C6564B" }}>
            <Trash2 size={15} /> Remove caregiver
          </button>
        )}
      </div>
    </div>
  );
}

function KidEditorSheet({ data, onSave, onDelete, onClose }) {
  const [name, setName] = useState(data.name || "");
  const [birthday, setBirthday] = useState(data.birthday || "");
  const [emoji, setEmoji] = useState(data.emoji || "🧒");
  const EMOJIS = ["🧒", "👦", "👧", "👶", "🧑", "🐈", "🐣", "⭐"];
  return (
    <div className="absolute inset-0 z-30 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />
        <p className="text-[15px] font-semibold text-[#1B2A4A] mb-3">{data.isNew ? "Add a child" : "Edit child"}</p>

        <p className="text-[12px] font-medium text-[#8A8474] mb-2">Pick an avatar</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className="w-11 h-11 rounded-full flex items-center justify-center text-[22px]"
              style={{ backgroundColor: "#FFF3E6", boxShadow: emoji === e ? "0 0 0 3px #fff, 0 0 0 5px var(--accent)" : "none" }}>
              {e}
            </button>
          ))}
        </div>

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma"
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none mb-4" style={{ borderColor: "#E7E1D4" }} />

        <p className="text-[12px] font-medium text-[#8A8474] mb-1.5">Birthday</p>
        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} max={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl px-3.5 py-2.5 text-[14px] border outline-none" style={{ borderColor: "#E7E1D4" }} />
        <p className="text-[12px] text-[#8A8474] mt-1.5 mb-5">{ageFromBirthday(birthday) === "" ? "We'll show their age and tailor ideas to it." : `Age ${ageFromBirthday(birthday)} — we'll tailor ideas to this.`}</p>

        <button onClick={() => onSave({ ...data, name, birthday, emoji })}
          className="w-full rounded-2xl py-3.5 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
          {data.isNew ? "Add child" : "Save"}
        </button>
        {!data.isNew && (
          <button onClick={() => onDelete(data.id)} className="w-full rounded-2xl py-3 mt-2 font-semibold text-[13px] flex items-center justify-center gap-1.5" style={{ color: "#C6564B" }}>
            <Trash2 size={15} /> Remove child
          </button>
        )}
      </div>
    </div>
  );
}

function ActivitiesScreen({ setSelectedPlace }) {
  return (
    <div className="pb-8">
      <TopBar title="Classes & Activities" />
      <p className="px-5 -mt-1 mb-3 text-[13px] text-[#8A8474]">Sports, dance, music, art and afterschool programs near you. Most need sign-up — look for the free-trial tag.</p>
      <div className="px-5 flex flex-col gap-6">
        {ACTIVITY_GROUPS.map((group) => {
          const places = PLACES.filter((p) => group.cats.includes(p.category));
          if (!places.length) return null;
          return (
            <div key={group.label}>
              <p className="text-[14px] font-semibold text-[#1B2A4A] mb-2.5">{group.label}</p>
              <div className="flex flex-col gap-2.5">
                {places.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPlace(p)} className="flex gap-3 p-3 rounded-2xl bg-white border text-left items-center" style={{ borderColor: "#EFEAE0" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0" style={{ backgroundColor: "#FFF3E6" }}>{p.photo}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-[#1B2A4A]">{p.name}</p>
                      <p className="text-[12px] text-[#8A8474]">{p.category} · {p.town}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {isClassBased(p) && <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EEF0F5", color: "#5B6B8C" }}>Sign-up</span>}
                        {classInfo(p)?.freeTrial === true && <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Free trial</span>}
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#F0EEE6] text-[#5C5648]">Ages {p.ageRange}</span>
                        {hoursLabel(p) && <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#F0EEE6] text-[#5C5648]">{hoursLabel(p)}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const HOWTO_STEPS = [
  { emoji: "🌅", title: "Welcome to Little Day", body: "The first app that plans your whole day out with the kids — where to go, eat, play, and everything in between. Here's a quick tour." },
  { emoji: "🧒", title: "1. Add your children", body: "In the Profile tab, add each child with their name and birthday. Switch between them anytime — the planner tailors ideas to whoever you've selected. Planning for more than one? Use 'Also bringing' on Home to plan around everyone." },
  { emoji: "✨", title: "2. Plan My Day", body: "Tap Plan My Day, then set the age, budget, time you have, and nap or 'home by' time. Little Day builds a full itinerary — with a lunch stop and a treat — in seconds." },
  { emoji: "🔔", title: "3. Smart nudges on Home", body: "Little Day watches the weather, your kids' birthdays, and no-school days (once you add your school district in a Home banner) to nudge you toward a plan before you even ask." },
  { emoji: "🔍", title: "4. Search & explore", body: "Use the search bar on the home screen to find anything — a place, a town, or a category like 'playground' or 'ice cream.' Or open Categories to browse by type." },
  { emoji: "🤸", title: "5. Classes & Activities", body: "Browse sports, dance, music, art, and afterschool programs. Look for the 'Free trial' tag, and note which need sign-up (no drop-ins)." },
  { emoji: "🎟️", title: "6. Check in & earn rewards", body: "Check in when you arrive somewhere. Every 5 check-ins unlocks a reward, and finishing a day earns stamps and badges in your Adventure Passport — add a photo to remember it by." },
  { emoji: "🔀", title: "7. Reshuffle, save & share", body: "Not feeling a plan? Reshuffle for a fresh one. Save the days you love, and share a day card with friends and family." },
  { emoji: "👨‍👩‍👧", title: "8. Friends, Family Circle & play dates", body: "Sign in from the Profile tab to set your name and username, invite a co-parent or caregiver into your Family Circle, and plan group play dates — with a built-in chat to coordinate details." },
];

function HowToOverlay({ open, onClose }) {
  const [step, setStep] = useState(0);
  if (!open) return null;
  const s = HOWTO_STEPS[step];
  const last = step === HOWTO_STEPS.length - 1;
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center" style={{ backgroundColor: "rgba(27,42,74,0.4)" }} onClick={onClose}>
      <div className="w-full rounded-b-3xl bg-white p-6 pt-7 pb-6" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetDown 0.24s ease-out" }}>
        <div className="flex justify-end mb-1">
          <button onClick={onClose} className="text-[13px] font-medium" style={{ color: "#8A8474" }}>Skip</button>
        </div>
        <div className="text-center px-2">
          <div className="text-[46px] mb-2">{s.emoji}</div>
          <h2 className="text-[20px] font-bold text-[#1B2A4A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</h2>
          <p className="text-[14px] text-[#5C5648] leading-relaxed" style={{ minHeight: 80 }}>{s.body}</p>
        </div>
        <div className="flex justify-center gap-1.5 my-4">
          {HOWTO_STEPS.map((_, i) => (
            <span key={i} className="rounded-full" style={{ width: i === step ? 20 : 7, height: 7, backgroundColor: i === step ? "var(--accent)" : "#E7DFD0", transition: "all 0.2s" }} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 rounded-2xl py-3 font-semibold text-[14px] border" style={{ borderColor: "#E7E1D4", color: "#1B2A4A" }}>Back</button>
          )}
          <button onClick={() => (last ? onClose() : setStep(step + 1))} className="flex-1 rounded-2xl py-3 text-white font-semibold text-[14px]" style={{ background: "var(--cta)" }}>
            {last ? "Start exploring" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

const SAFETY_RESOURCES = [
  {
    group: "Emergency rooms & trauma centers", emoji: "🏥", intro: "For a true emergency, always call 911 first. These are the nearest hospitals with emergency care for children.",
    items: [
      { name: "Northern Westchester Hospital ER", town: "Mount Kisco", detail: "400 E Main St · the closest ER to Katonah · open 24/7", phone: "914-666-1200", website: "nwh.northwell.edu", note: "Open 24/7" },
      { name: "Maria Fareri Children's Hospital", town: "Valhalla", detail: "100 Woods Rd · the region's only Level I PEDIATRIC trauma center, with a pediatric ER and PICU", phone: "914-493-7000", website: "wmchealth.org", note: "Children's trauma center" },
      { name: "Westchester Medical Center", town: "Valhalla", detail: "100 Woods Rd · Level I adult trauma & burn center; the Hudson Valley's referral hospital", phone: "914-493-7000", website: "wmchealth.org", note: "Level I trauma" },
      { name: "White Plains Hospital ER", town: "White Plains", detail: "41 E Post Rd · 24-hour emergency department", phone: "914-681-0600", website: "wphospital.org", note: "Open 24/7" },
      { name: "Phelps Hospital ER", town: "Sleepy Hollow", detail: "701 N Broadway · 24-hour emergency care", phone: "914-366-3000", website: "phelps.northwell.edu", note: "Open 24/7" },
    ],
  },
  {
    group: "Urgent care (not an emergency)", emoji: "🩹", intro: "For fevers, sprains, stitches and the after-hours ear infection — faster and cheaper than an ER visit.",
    items: [
      { name: "PM Pediatrics", town: "Yorktown Heights", detail: "Pediatric-only urgent care, open late every night", phone: "", website: "pmpediatrics.com", note: "Children only · walk in" },
      { name: "Optum (CareMount) Urgent Care", town: "Mount Kisco", detail: "Walk-in urgent care close to home", phone: "", website: "optum.com", note: "Walk in" },
      { name: "Northwell-GoHealth Urgent Care", town: "Multiple Westchester", detail: "Several county locations with evening & weekend hours", phone: "", website: "gohealthuc.com", note: "Check locations" },
      { name: "Poison Control (24/7, free)", town: "Nationwide", detail: "Immediate expert advice for any swallowed or suspected poisoning", phone: "1-800-222-1222", note: "Save this number" },
    ],
  },
  {
    group: "Car seat checks", emoji: "🫶", intro: "Certified technicians check and install your car seat correctly — free, but you'll need to book a slot.",
    items: [
      { name: "Bedford Police Department", town: "Bedford Hills", detail: "307 Bedford Rd · closest to Katonah", phone: "914-241-3111", note: "Book ahead" },
      { name: "Northern Westchester Hospital", town: "Mount Kisco", detail: "Free inspections by certified car seat techs", phone: "", website: "nwh.northwell.edu", note: "Free · call first" },
      { name: "Westchester County Public Safety", town: "Hawthorne", detail: "1 Saw Mill River Pkwy", phone: "914-864-7671", note: "Book ahead" },
      { name: "SAFE KIDS / Blythedale Children's Hospital", town: "Valhalla", detail: "95 Bradhurst Ave · weekdays midday", phone: "914-592-7555", note: "Book ahead" },
      { name: "Croton-on-Hudson Police", town: "Croton-on-Hudson", detail: "1 Van Wyck St", phone: "914-271-5177", note: "Book ahead" },
      { name: "Peekskill Police Department", town: "Peekskill", detail: "2 Nelson Ave · Community Policing Unit", phone: "914-737-8000", note: "Book ahead" },
      { name: "Eastchester Police Department", town: "Eastchester", detail: "40 Mill Rd · Mon–Sat 9–11 AM & 4–6 PM", phone: "914-961-3464", note: "Book ahead" },
      { name: "Dobbs Ferry Police Department", town: "Dobbs Ferry", detail: "112 Main St", phone: "914-693-5500", note: "Book ahead" },
      { name: "Yonkers Police Department", town: "Yonkers", detail: "36 Radford St · Mon–Fri 8 AM–4 PM", phone: "914-377-7375", note: "Book ahead" },
      { name: "Fairview Fire Department", town: "White Plains", detail: "19 Rosemont Blvd", phone: "914-949-2828", note: "Book ahead" },
      { name: "Greenburgh Police (Town Hall)", town: "White Plains", detail: "177 Hillside Ave · 1st & 3rd Saturdays 11 AM–2 PM", phone: "914-682-5334", note: "Book ahead" },
      { name: "NY State fitting-station directory", town: "Statewide", detail: "Official list of every certified inspection station", phone: "", website: "trafficsafety.ny.gov", note: "Full state list" },
    ],
  },
  {
    group: "CPR & first aid classes", emoji: "❤️", intro: "Pediatric CPR is one of the most valuable skills a parent or sitter can have.",
    items: [
      { name: "American Red Cross", town: "White Plains", detail: "106 N Broadway · child & baby CPR, first aid", phone: "", website: "redcross.org", note: "Sign up online" },
      { name: "CPRed", town: "White Plains", detail: "200 Mamaroneck Ave · Pediatric First Aid + CPR (AHA)", phone: "914-497-8998", website: "cpred.com", note: "Groups welcome" },
      { name: "White Plains Hospital", town: "White Plains", detail: "41 E Post Rd · CPR training site", phone: "", website: "wphospital.org", note: "See upcoming dates" },
      { name: "Westchester County Emergency Services", town: "Valhalla", detail: "County CPR/AED training programs", phone: "", website: "emergencyservices.westchestercountyny.gov", note: "Sign up online" },
    ],
  },
  {
    group: "Child safety programs", emoji: "🛡️", intro: "Broader safety education for parents, sitters and older kids.",
    items: [
      { name: "Safe Kids Westchester", town: "Valhalla", detail: "Child passenger, home & water safety programs (Blythedale)", phone: "914-592-7555", note: "Year-round" },
      { name: "Red Cross Babysitting & Child Care", town: "Online + local", detail: "Certifies sitters ages 11+ in safety basics", phone: "", website: "redcross.org", note: "Perfect for caregivers" },
    ],
  },
];

function SafetyScreen({ onBack }) {
  return (
    <div className="pb-8">
      <TopBar title="Safety & Prep" onBack={onBack} />
      <div className="px-5 -mt-1 mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>
          📍 Westchester County · more regions coming
        </span>
      </div>
      <p className="px-5 mb-4 text-[13px] text-[#8A8474]">Real local resources to keep little ones safe — car seat checks, CPR classes, and safety programs.</p>
      <div className="px-5 flex flex-col gap-6">
        {SAFETY_RESOURCES.map((g) => (
          <div key={g.group}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[18px]">{g.emoji}</span>
              <p className="text-[14px] font-semibold text-[#1B2A4A]">{g.group}</p>
            </div>
            <p className="text-[12px] text-[#8A8474] mb-2.5">{g.intro}</p>
            <div className="flex flex-col gap-2.5">
              {g.items.map((it) => (
                <div key={it.name} className="rounded-2xl p-3.5 bg-white border" style={{ borderColor: "#EFEAE0" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1B2A4A]">{it.name}</p>
                      <p className="text-[12px] text-[#8A8474]">{it.town} · {it.detail}</p>
                    </div>
                    {it.phone && (
                      <a href={`tel:${it.phone.replace(/[^0-9+]/g, "")}`} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E4F4E9" }}>
                        <Phone size={15} color="#2E8B57" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3E6", color: "#B08A5A" }}>{it.note}</span>
                    {it.website && (
                      <a href={`https://${it.website}`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
                        {it.website} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-[#B8B0A0] leading-snug">Details verified from county and hospital listings, but schedules and contacts change — always call ahead. Car seat checks need a booked slot — call before you drive over. Resources cover Westchester County for now — built to expand region by region as Little Day grows.</p>
      </div>
    </div>
  );
}

/* Beta access gate. Change the code here anytime: */
const BETA_CODE = "SUNSHINE";

function BetaGate({ onUnlock }) {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const tryUnlock = () => {
    if (code.trim().toUpperCase() === BETA_CODE) { onUnlock(); }
    else { setShake(true); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ backgroundColor: "#FFFBF5" }}>
      <div className="w-full max-w-sm text-center" style={{ animation: shake ? "shakeX 0.4s" : "none" }}>
        <div className="flex justify-center mb-3"><LittleDaySun size={64} /></div>
        <h1 className="text-[26px] font-bold" style={{ color: "#1B2A4A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>little day</h1>
        <p className="text-[12px] font-bold tracking-widest mt-1" style={{ color: "#F5B71F" }}>PRIVATE BETA</p>
        <p className="text-[14px] mt-4 mb-5" style={{ color: "#8A8474" }}>
          Little Day is in early testing with a small group of Westchester families. Enter your invite code to come in.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          placeholder="Invite code"
          autoCapitalize="characters"
          className="w-full rounded-2xl px-4 py-3.5 text-center text-[16px] font-semibold tracking-widest border-2 outline-none"
          style={{ borderColor: "#F0E4D4", color: "#1B2A4A", backgroundColor: "#FFFFFF" }}
        />
        <button onClick={tryUnlock} className="w-full rounded-2xl py-3.5 mt-3 text-white font-semibold text-[15px]" style={{ background: "linear-gradient(135deg, #FF8C61, #FFC857)" }}>
          Let's go
        </button>
        <p className="text-[11px] mt-5" style={{ color: "#B8B0A0" }}>Don't have a code? Little Day opens wider soon. {"☀️"}</p>
      </div>
      <style>{`@keyframes shakeX { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

function AuthSheet({ open, onClose, session }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email"); // email -> sent -> code
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!open) return null;

  const signInWithGoogle = async () => {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    setBusy(false);
    if (error) {
      setMsg(error.message.includes("not enabled")
        ? "Google sign-in isn't switched on yet — use your email below for now."
        : error.message);
    }
    // On success the browser redirects to Google, so nothing else to do here.
  };

  const sendLink = async () => {
    if (!email.includes("@")) { setMsg("Enter a valid email"); return; }
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setStage("sent");
  };

  const verifyCode = async () => {
    setBusy(true); setMsg("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) { setMsg("That code didn't match — check the email and try again."); return; }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-full rounded-t-3xl bg-white p-6 pb-8" onClick={(e) => e.stopPropagation()} style={{ animation: "sheetUp 0.22s ease-out" }}>
        <div className="w-10 h-1 rounded-full bg-[#E7E1D4] mx-auto mb-4" />

        {stage === "email" && (
          <>
            <p className="text-[17px] font-bold text-[#1B2A4A] text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Sign in or create your account
            </p>
            <p className="text-[13px] text-[#8A8474] text-center mt-1 mb-4 max-w-[300px] mx-auto">
              Your children, caregivers and favorites will sync to any device you sign in on.
            </p>

            <button
              onClick={signInWithGoogle}
              disabled={busy}
              className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2.5 font-semibold text-[14px] border-2 bg-white"
              style={{ borderColor: "#E7E1D4", color: "#1B2A4A", opacity: busy ? 0.6 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7.2-10.2 7.2-17.4z"/>
                <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.2 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-3.5">
              <span className="flex-1 h-px" style={{ backgroundColor: "#EFEAE0" }} />
              <span className="text-[11.5px]" style={{ color: "#B8B0A0" }}>or use email</span>
              <span className="flex-1 h-px" style={{ backgroundColor: "#EFEAE0" }} />
            </div>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendLink()}
              inputMode="email"
              autoCapitalize="none"
              placeholder="you@example.com"
              className="w-full rounded-2xl px-4 py-3.5 text-[15px] border-2 outline-none text-center"
              style={{ borderColor: "#F0E4D4" }}
            />
            <button onClick={sendLink} disabled={busy}
              className="w-full rounded-2xl py-3.5 mt-3 text-white font-semibold text-[14px]"
              style={{ background: "var(--cta)", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
            <p className="text-[11px] text-[#B8B0A0] text-center mt-3">No passwords — we email you a secure link.</p>
          </>
        )}

        {stage === "sent" && (
          <div className="text-center">
            <div className="flex justify-center mb-2"><LittleDaySun size={48} /></div>
            <p className="text-[17px] font-bold text-[#1B2A4A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Check your email</p>
            <p className="text-[13.5px] text-[#5C5648] mt-2 max-w-[300px] mx-auto leading-snug">
              We sent a sign-in link to <span className="font-semibold">{email}</span>. Open it on this device and you'll land right back here, signed in.
            </p>
            <div className="rounded-2xl p-3.5 mt-4 text-left" style={{ backgroundColor: "#FFF8EE" }}>
              <p className="text-[12px]" style={{ color: "#B08A5A" }}>
                Can't find it? Check spam or promotions — it can take a minute to arrive.
              </p>
            </div>
            <button onClick={sendLink} disabled={busy} className="w-full rounded-2xl py-3 mt-3 font-semibold text-[13px] border" style={{ borderColor: "#E7E1D4", color: "#1B2A4A" }}>
              {busy ? "Sending…" : "Resend the link"}
            </button>
            <button onClick={() => setStage("code")} className="w-full py-2.5 mt-1 text-[12.5px] font-medium" style={{ color: "#8A8474" }}>
              My email has a 6-digit code instead
            </button>
            <button onClick={() => { setStage("email"); setMsg(""); }} className="w-full py-1 text-[12.5px] font-medium" style={{ color: "#8A8474" }}>
              Use a different email
            </button>
          </div>
        )}

        {stage === "code" && (
          <>
            <p className="text-[17px] font-bold text-[#1B2A4A] text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Enter your code</p>
            <p className="text-[13px] text-[#8A8474] text-center mt-1 mb-4">Type the 6-digit code from the email.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              inputMode="numeric"
              placeholder="123456"
              className="w-full rounded-2xl px-4 py-3.5 text-[19px] tracking-[0.4em] border-2 outline-none text-center font-bold"
              style={{ borderColor: "#F0E4D4", color: "#1B2A4A" }}
            />
            <button onClick={verifyCode} disabled={busy}
              className="w-full rounded-2xl py-3.5 mt-3 text-white font-semibold text-[14px]"
              style={{ background: "var(--cta)", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button onClick={() => setStage("sent")} className="w-full py-2.5 mt-1 text-[13px] font-medium" style={{ color: "#8A8474" }}>Back</button>
          </>
        )}

        {msg && <p className="text-[12px] text-center mt-2" style={{ color: "#C6564B" }}>{msg}</p>}
      </div>
    </div>
  );
}

function CommunityScreen({ setSelectedPlace }) {
  const todays = EVENTS_SEED.filter(isEventToday);
  const rest = EVENTS_SEED.filter((e) => !isEventToday(e));
  const Card = ({ ev }) => {
    const pl = PLACES.find((p) => p.id === ev.placeId);
    const today = isEventToday(ev);
    return (
      <button
        onClick={() => pl && setSelectedPlace(pl)}
        className="w-full text-left rounded-2xl p-4 border"
        style={{
          borderColor: today ? "#F5B71F" : "#EFEAE0",
          borderWidth: today ? 2 : 1,
          background: today ? "linear-gradient(160deg,#FFFBF0,#FFF3E6)" : "#FFFFFF",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-[26px] shrink-0">{ev.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <p className="text-[15px] font-semibold text-[#1B2A4A]">{ev.title}</p>
              {today && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--cta)" }}>TODAY</span>}
              {ev.free && <span className="text-[10.5px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E4F4E9", color: "#2E8B57" }}>Free</span>}
            </div>
            <p className="text-[12.5px] text-[#8A8474]">{pl ? `${pl.town} · ` : ""}{ev.day} · {ev.time}</p>
            <p className="text-[12.5px] text-[#5C5648] mt-1.5 leading-snug">{ev.blurb}</p>
            {pl && <p className="text-[11.5px] mt-1.5" style={{ color: "#B08A5A" }}>{pl.distanceMi} mi away · tap for details</p>}
          </div>
        </div>
      </button>
    );
  };
  return (
    <div className="pb-8">
      <TopBar title="Community Events" />
      <p className="px-5 -mt-1 mb-4 text-[13px] text-[#8A8474]">
        Farmers markets, story hours, festivals and family nights around Westchester.
      </p>
      <div className="px-5 flex flex-col gap-5">
        {todays.length > 0 && (
          <div>
            <p className="text-[14px] font-semibold text-[#1B2A4A] mb-2.5">Happening today</p>
            <div className="flex flex-col gap-2.5">
              {todays.map((ev) => <Card key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
        <div>
          <p className="text-[14px] font-semibold text-[#1B2A4A] mb-2.5">This week &amp; recurring</p>
          <div className="flex flex-col gap-2.5">
            {rest.map((ev) => <Card key={ev.id} ev={ev} />)}
          </div>
        </div>
        <div className="rounded-2xl p-4 border" style={{ borderColor: "#EFEAE0", backgroundColor: "#FFF8EE" }}>
          <p className="text-[13px] font-semibold text-[#1B2A4A] mb-1">Know about an event?</p>
          <p className="text-[12.5px] text-[#8A8474]">Fireworks, fairs, library programs, school carnivals — send them our way and we'll add them for every family here.</p>
          <p className="text-[11px] mt-2" style={{ color: "#B8B0A0" }}>Curated for now — one-off dates like fireworks are added by hand until live event feeds arrive.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT APP
--------------------------------------------------------- */
export default function LittleDayApp() {
  const [seenWelcome, setSeenWelcome] = usePersistentState("seenWelcome", false);
  const [screen, setScreen] = useState(seenWelcome ? "home" : "welcome");
  const [prevScreen, setPrevScreen] = useState("home");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [homeBy, setHomeBy] = useState(null);
  const [napHour, setNapHour] = useState(null);
  const [savedDays, setSavedDays] = usePersistentState("savedDays", []);
  const [reviews, setReviews] = usePersistentState("reviews", REVIEWS_SEED);
  const [completedDays, setCompletedDays] = usePersistentState("completedDays", []);
  const addDayPhoto = (dayId, dataUrl) => {
    setCompletedDays((cur) => cur.map((d) => d.id === dayId ? { ...d, memoryPhoto: dataUrl } : d));
  };
  const [celebration, setCelebration] = useState(null);
  const [dayCard, setDayCard] = useState(null);
  const [checkIns, setCheckIns] = usePersistentState("checkIns", {});
  const [reward, setReward] = useState(null);
  const [surpriseMode, setSurpriseMode] = useState(false);
  const [lastPrefs, setLastPrefs] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHowTo, setShowHowTo] = useState(false);
  const [, setWeatherV] = useState(0);
  useEffect(() => { fetchLiveWeather().then(() => setWeatherV((v) => v + 1)); }, []);

  const [kids, setKids] = usePersistentState("kids", [{ id: "k1", name: "Little one", birthday: "2022-06-15", emoji: "🧒" }]);
  const [activeKidId, setActiveKidId] = usePersistentState("activeKidId", "k1");
  const [companionKidIds, setCompanionKidIds] = usePersistentState("companionKidIds", []);
  const toggleCompanionKid = (id) => {
    setCompanionKidIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };
  const [schoolDistrictId, setSchoolDistrictId] = usePersistentState("schoolDistrictId", null);
  const [kidEditor, setKidEditor] = useState(null);
  const [sitters, setCaregivers] = usePersistentState("sitters", []);
  const [sitterEditor, setSitterEditor] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [googlePlace, setGooglePlace] = useState(null);

  const [favorites, setFavorites] = usePersistentState("favorites", []);
  const location = useGeolocation();
  const [friends, setFriends] = usePersistentState("friends", FRIENDS_SEED);

  // ---- Accounts & cloud sync (Stage 1) ----
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const cloudLoaded = useRef(false);
  const [activeFamilyId, setActiveFamilyId] = usePersistentState("activeFamilyId", null);
  const effectiveFamilyId = activeFamilyId || (session ? session.user.id : null);
  useEffect(() => {
    if (!backendReady()) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess || null));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!backendReady() || !session || !effectiveFamilyId) { cloudLoaded.current = false; return; }
    cloudLoaded.current = false;
    (async () => {
      const { data } = await supabase.from("user_data").select("*").eq("user_id", effectiveFamilyId).maybeSingle();
      if (data) {
        const has = (v) => Array.isArray(v) ? v.length > 0 : v && Object.keys(v).length > 0;
        if (has(data.kids)) { setKids(data.kids); setActiveKidId(data.kids[0].id); }
        if (has(data.sitters)) setCaregivers(data.sitters);
        if (has(data.favorites)) setFavorites(data.favorites);
        if (has(data.saved_days)) setSavedDays(data.saved_days);
        if (has(data.check_ins)) setCheckIns(data.check_ins);
        if (has(data.completed_days)) setCompletedDays(data.completed_days);
      }
      cloudLoaded.current = true;
    })();
  }, [session, effectiveFamilyId]);
  useEffect(() => {
    if (!backendReady() || !session || !effectiveFamilyId || !cloudLoaded.current) return;
    const t = setTimeout(() => {
      supabase.from("user_data").upsert({
        user_id: effectiveFamilyId,
        kids, sitters, favorites,
        saved_days: savedDays, check_ins: checkIns, completed_days: completedDays,
        updated_at: new Date().toISOString(),
      }).then(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [session, effectiveFamilyId, kids, sitters, favorites, savedDays, checkIns, completedDays]);
  const signOut = async () => { if (backendReady()) await supabase.auth.signOut(); showToast("Signed out — this device keeps its local copy"); };

  // ---- Family Circle (caregiver access) ----
  const [myCaregivers, setMyCaregivers] = useState([]);
  const [caregiverLinks, setCaregiverLinks] = useState([]);
  const [caregiverInvite, setCaregiverInvite] = useState(null);
  const [pendingCaregiverCode, setPendingCaregiverCode] = useState(null);
  const [forceEditNameToken, setForceEditNameToken] = useState(null);

  const [pendingFriendId, setPendingFriendId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("caregiver");
    const addfriend = params.get("addfriend");
    if (code) {
      setPendingCaregiverCode(code);
      params.delete("caregiver");
    }
    if (addfriend) {
      setPendingFriendId(addfriend);
      params.delete("addfriend");
    }
    if (code || addfriend) {
      const clean = window.location.pathname + (params.toString() ? `?${params}` : "");
      window.history.replaceState({}, "", clean);
    }
  }, []);
  useEffect(() => {
    if (!pendingFriendId || !backendReady() || !session) return;
    (async () => {
      if (pendingFriendId === session.user.id) { showToast("That's your own invite link!"); setPendingFriendId(null); return; }
      const { data: profs } = await supabase.rpc("get_profiles_by_ids", { ids: [pendingFriendId] });
      const other = (profs || [])[0];
      const label = other ? ([other.first_name, other.last_name].filter(Boolean).join(" ") || other.display_name || (other.handle ? `@${other.handle}` : "your friend")) : "your friend";
      const { error } = await supabase.rpc("add_friendship", { other_id: pendingFriendId });
      if (error) { showToast("That invite link didn't work — ask for a new one"); }
      else { showToast(`You're connected with ${label}!`); loadRealFriends(); goTo("friends"); }
      setPendingFriendId(null);
    })();
  }, [pendingFriendId, session]);
  useEffect(() => {
    if (!pendingCaregiverCode || !backendReady() || !session) return;
    (async () => {
      const { data, error } = await supabase.rpc("redeem_family_invite", { p_code: pendingCaregiverCode });
      if (error) { showToast("That caregiver invite link didn't work — ask for a new one"); }
      else {
        showToast(`You're in! Add your name so ${data || "they"} recognize you`);
        goTo("profile");
        setForceEditNameToken(Date.now());
      }
      setPendingCaregiverCode(null);
    })();
  }, [pendingCaregiverCode, session]);

  const loadFamilyCircle = async () => {
    if (!backendReady() || !session) { setMyCaregivers([]); setCaregiverLinks([]); return; }
    const { data: mine } = await supabase
      .from("family_members").select("id, caregiver_id, profiles!family_members_caregiver_id_fkey(display_name, first_name, last_name)")
      .eq("owner_id", session.user.id);
    setMyCaregivers(mine || []);
    const { data: access } = await supabase
      .from("family_members").select("id, owner_id, profiles!family_members_owner_id_fkey(display_name, first_name, last_name)")
      .eq("caregiver_id", session.user.id);
    setCaregiverLinks(access || []);
  };
  useEffect(() => { loadFamilyCircle(); }, [session]);

  const createCaregiverInvite = async () => {
    if (!backendReady() || !session) return;
    const { data, error } = await supabase.rpc("create_family_invite");
    if (error || !data) { showToast("Couldn't create an invite — try again"); return; }
    const link = `${window.location.origin}${window.location.pathname}?caregiver=${data}`;
    setCaregiverInvite({ code: data, link });
  };
  const removeCaregiverAccess = async (rowId) => {
    if (!backendReady()) return;
    await supabase.from("family_members").delete().eq("id", rowId);
    loadFamilyCircle();
    showToast("Caregiver access removed");
  };
  const switchFamily = (ownerId) => {
    setActiveFamilyId(ownerId);
    showToast(ownerId ? "Now viewing that family's plans" : "Back to your own family");
  };

  // ---- Friends: real name/handle search ----
  const [profileNames, setProfileNames] = useState({ firstName: "", lastName: "", handle: "" });
  useEffect(() => {
    if (!backendReady() || !session) return;
    supabase.from("profiles").select("first_name, last_name, handle").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfileNames({ firstName: data.first_name || "", lastName: data.last_name || "", handle: data.handle || "" }); });
  }, [session]);
  const saveProfileNames = async (next) => {
    if (!backendReady() || !session) return { ok: false, message: "Sign in first to set your name" };
    const { error } = await supabase.from("profiles").update({
      first_name: next.firstName.trim(), last_name: next.lastName.trim(), handle: next.handle.trim() || null,
    }).eq("id", session.user.id);
    if (error) {
      const msg = /duplicate|unique/i.test(error.message) ? "That username is taken — try another" : "Couldn't save — try again";
      return { ok: false, message: msg };
    }
    setProfileNames(next);
    return { ok: true, message: "Profile saved" };
  };
  const searchRealProfiles = async (q) => {
    if (!backendReady() || !session || q.trim().length < 2) return [];
    const { data, error } = await supabase.rpc("search_profiles", { q: q.trim() });
    return error ? [] : (data || []);
  };
  const addRealFriend = async (otherId, label) => {
    if (!backendReady() || !session) return;
    const { error } = await supabase.rpc("add_friendship", { other_id: otherId });
    if (!error) { showToast(`${label} added to your friends`); loadRealFriends(); }
  };
  const loadRealFriends = async () => {
    if (!backendReady() || !session) return;
    const uid = session.user.id;
    const { data: rows } = await supabase.from("friendships").select("a,b").or(`a.eq.${uid},b.eq.${uid}`);
    const otherIds = (rows || []).map((r) => (r.a === uid ? r.b : r.a));
    if (!otherIds.length) { setFriends((cur) => cur.filter((f) => !f.real)); return; }
    const { data: profiles } = await supabase.rpc("get_profiles_by_ids", { ids: otherIds });
    const real = (profiles || []).map((p) => ({
      id: p.id,
      name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || (p.handle ? `@${p.handle}` : "Little Day parent"),
      emoji: "🙂", kids: "", town: "", real: true,
    }));
    setFriends((cur) => [...real, ...cur.filter((f) => !f.real)]);
  };
  useEffect(() => { loadRealFriends(); }, [session]);
  const [sharedDays, setSharedDays] = useState(SHARED_DAYS_SEED);
  const [playDates, setPlayDates] = useState(PLAYDATES_SEED);
  const [toast, setToast] = useState(null);
  const [invitePickerOpen, setInvitePickerOpen] = useState(false);
  const [chatGroupId, setChatGroupId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const loadRealPlayDates = async () => {
    if (!backendReady() || !session) return;
    const uid = session.user.id;
    const { data: rows } = await supabase.from("play_dates").select("*").or(`from_user.eq.${uid},to_user.eq.${uid}`).order("created_at", { ascending: false });
    if (!rows || !rows.length) { setPlayDates((cur) => cur.filter((p) => !p.real)); return; }
    const otherIds = [...new Set(rows.map((r) => (r.from_user === uid ? r.to_user : r.from_user)))];
    const { data: profiles } = await supabase.rpc("get_profiles_by_ids", { ids: otherIds });
    const nameFor = (id) => {
      const p = (profiles || []).find((x) => x.id === id);
      if (!p) return "A Little Day parent";
      return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || (p.handle ? `@${p.handle}` : "A Little Day parent");
    };
    const mapped = rows.map((r) => {
      const stops = (r.day_plan && r.day_plan.stops) || [];
      const mine = r.from_user === uid;
      return {
        id: r.id, real: true, groupId: r.group_id, stops,
        direction: mine ? "outgoing" : "incoming",
        friend: nameFor(mine ? r.to_user : r.from_user),
        friendEmoji: "🙂",
        placeId: stops[0] ? stops[0].placeId : null,
        time: stops[0] ? stops[0].time : null,
        day: "Planned",
        status: r.status === "invited" ? "pending" : r.status,
      };
    });
    setPlayDates((cur) => [...mapped, ...cur.filter((p) => !p.real)]);
  };
  useEffect(() => { loadRealPlayDates(); }, [session]);

  const acceptPlayDate = async (id) => {
    const pd = playDates.find((p) => p.id === id);
    if (pd && pd.real && backendReady()) {
      await supabase.from("play_dates").update({ status: "confirmed" }).eq("id", id);
      loadRealPlayDates();
    } else {
      setPlayDates((cur) => cur.map((p) => (p.id === id ? { ...p, status: "confirmed" } : p)));
    }
    showToast("You're in! Play date confirmed 🎉");
  };
  const declinePlayDate = async (id) => {
    const pd = playDates.find((p) => p.id === id);
    if (pd && pd.real && backendReady()) {
      await supabase.from("play_dates").delete().eq("id", id);
      loadRealPlayDates();
    } else {
      setPlayDates((cur) => cur.filter((p) => p.id !== id));
    }
  };
  const addFriend = (nameOrPhone) => {
    const isPhone = /^[\d\s()+-]{7,}$/.test(nameOrPhone.trim());
    setFriends((cur) => [...cur, {
      id: `f${Date.now()}`,
      name: isPhone ? nameOrPhone.trim() : nameOrPhone,
      emoji: "🙂",
      kids: "New friend",
      town: "Nearby",
    }]);
    showToast(isPhone ? "Invite noted — we'll text them once real invites are live" : `${nameOrPhone} added to your friends`);
  };
  const shareCurrentDay = () => {
    if (!itinerary.length) return;
    setSharedDays((cur) => [
      {
        id: `sd${Date.now()}`,
        by: "You",
        byEmoji: "🌞",
        title: "Shared just now",
        stops: itinerary.map((i) => ({ placeId: i.place.id, time: i.time })),
      },
      ...cur,
    ]);
    showToast("Day shared with your friends");
  };
  const inviteFriendToDay = async (picked) => {
    const first = itinerary[0];
    if (!first) return;
    const arr = Array.isArray(picked) ? picked : [picked];
    if (!arr.length) return;
    const realFriends = arr.filter((f) => f.real);
    const demoFriends = arr.filter((f) => !f.real);

    if (realFriends.length && backendReady() && session) {
      const dayPlan = { stops: itinerary.map((i) => ({ placeId: i.place.id, time: i.time })) };
      const { error } = await supabase.rpc("create_group_plan", { p_day_plan: dayPlan, p_friend_ids: realFriends.map((f) => f.id) });
      if (!error) loadRealPlayDates();
    }
    if (demoFriends.length) {
      setPlayDates((cur) => [
        ...cur,
        ...demoFriends.map((friend, i) => ({
          id: `pd${Date.now()}_${i}`,
          direction: "outgoing",
          friend: friend.name,
          friendEmoji: friend.emoji,
          placeId: first.place.id,
          time: first.time,
          day: "Soon",
          status: "invited",
        })),
      ]);
    }
    setInvitePickerOpen(false);
    showToast(
      arr.length === 1
        ? `Play date invite sent to ${arr[0].name}`
        : `Group play date sent to ${arr.length} families 🎉`
    );
  };
  const useSharedDay = (stops) => {
    const items = stops
      .map((s) => {
        const place = PLACES.find((p) => p.id === s.placeId);
        return place ? { place, time: s.time } : null;
      })
      .filter(Boolean);
    setItinerary(items);
    setHomeBy(null);
    setNapHour(null);
    goTo("itinerary");
    showToast("Loaded into your day");
  };

  const surpriseMe = () => {
    const nh = currentHour();
    const openPool = PLACES.filter((p) => {
      const o = isOpenNow(p, nh);
      return o === null || o === true;
    });
    let pool = openPool.length ? openPool : PLACES;
    if (surpriseMode && selectedPlace) {
      const noRepeat = pool.filter((p) => p.id !== selectedPlace.id);
      if (noRepeat.length) pool = noRepeat;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (screen !== "place") setPrevScreen(screen);
    setSelectedPlace(pick);
    setSurpriseMode(true);
    setScreen("place");
  };

  const currentDaySaved = savedDays.some(
    (d) => d.stops.map((s) => s.placeId).join(",") === itinerary.map((i) => i.place.id).join(",")
  );
  const saveCurrentDay = () => {
    if (!itinerary.length || currentDaySaved) return;
    const names = itinerary.map((i) => i.place.name);
    const title = names.length > 1 ? `${names[0]} + ${names.length - 1} more` : names[0];
    setSavedDays((cur) => [
      { id: `save${Date.now()}`, title, stops: itinerary.map((i) => ({ placeId: i.place.id, time: i.time })) },
      ...cur,
    ]);
    showToast("Day saved — find it under Saved");
  };
  const deleteSavedDay = (id) => setSavedDays((cur) => cur.filter((d) => d.id !== id));

  const addReview = (placeId, stars, text) => {
    if (!stars) return;
    setReviews((cur) => ({
      ...cur,
      [placeId]: [
        { id: `rv${Date.now()}`, stars, text: (text || "").trim(), author: "You", when: "Just now" },
        ...(cur[placeId] || []),
      ],
    }));
    showToast("Thanks for your review!");
  };

  const stats = computeStats(completedDays, checkIns);
  const earnedBadges = BADGES.filter((b) => b.test(stats));
  const itinSig = itinerary.map((i) => i.place.id).join(",");
  const currentDayCompleted = completedDays.some((d) => d.stops.map((s) => s.placeId).join(",") === itinSig);
  const completeDay = () => {
    if (!itinerary.length) return;
    const beforeIds = new Set(BADGES.filter((b) => b.test(computeStats(completedDays, checkIns))).map((b) => b.id));
    const record = {
      id: `day${Date.now()}`,
      date: new Date().toISOString(),
      stops: itinerary.map((i) => ({ placeId: i.place.id, name: i.place.name, photo: i.place.photo, category: i.place.category, tags: i.place.tags, time: i.time })),
    };
    const next = [record, ...completedDays];
    setCompletedDays(next);
    const newBadges = BADGES.filter((b) => b.test(computeStats(next, checkIns)) && !beforeIds.has(b.id));
    setCelebration({ record, newBadges });
  };

  const checkIn = (place) => {
    if (!place) return;
    const newCount = (checkIns[place.id] || 0) + 1;
    setCheckIns((cur) => ({ ...cur, [place.id]: newCount }));
    if (newCount % 5 === 0) {
      setReward({ place, number: newCount / 5 });
    } else {
      showToast(`Checked in at ${place.name}! ${newCount % 5}/5 toward a reward`);
    }
  };

  // Weather swap: if rain risk and an outdoor stop falls after it, offer an indoor swap.
  const weatherSwap = (() => {
    if (WEATHER.rainRiskAfter == null) return null;
    const idx = itinerary.findIndex(
      (it) => it.place.tags.includes("outdoor") && !it.place.tags.includes("rain-friendly") && it.time >= WEATHER.rainRiskAfter - 1
    );
    if (idx === -1) return null;
    const from = itinerary[idx].place;
    const used = new Set(itinerary.map((i) => i.place.id));
    const to = PLACES.find(
      (p) => p.tags.includes("indoor") && !used.has(p.id) && p.distanceMi <= from.distanceMi + 8
    );
    if (!to) return null;
    return { idx, from, to };
  })();
  const doWeatherSwap = () => {
    if (!weatherSwap) return;
    setItinerary((cur) =>
      cur.map((it, i) => (i === weatherSwap.idx ? { place: weatherSwap.to, time: it.time } : it))
    );
    showToast(`Swapped to ${weatherSwap.to.name} ☔`);
  };

  const toggleFavorite = (id) =>
    setFavorites((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const goTo = (next) => {
    setPrevScreen(screen);
    setScreen(next);
  };

  const handleSelectPlace = (place) => {
    setPrevScreen(screen);
    setSelectedPlace(place);
    setSurpriseMode(false);
    setScreen("place");
  };

  const handleGenerate = (prefs) => {
    setLastPrefs(prefs);
    setItinerary(buildItinerary(prefs));
    setHomeBy(prefs.endHour ?? null);
    setNapHour(prefs.napHour ?? null);
    goTo("planning");
  };

  const reshuffleItinerary = () => {
    if (!lastPrefs) return;
    setItinerary(buildItinerary({ ...lastPrefs, shuffle: true }));
    showToast("Fresh plan! ✨");
  };

  const activeKid = kids.find((k) => k.id === activeKidId) || kids[0] || null;
  const openAddKid = () => setKidEditor({ id: null, name: "", birthday: "", emoji: "🧒", isNew: true });
  const openEditKid = (kid) => setKidEditor({ ...kid, isNew: false });
  const saveKid = (d) => {
    if (d.isNew) {
      const id = `k${Date.now()}`;
      setKids((cur) => [...cur, { id, name: d.name || "New child", birthday: d.birthday, emoji: d.emoji }]);
      setActiveKidId(id);
      showToast("Child added");
    } else {
      setKids((cur) => cur.map((k) => (k.id === d.id ? { ...k, name: d.name || k.name, birthday: d.birthday, emoji: d.emoji } : k)));
      showToast("Saved");
    }
    setKidEditor(null);
  };
  const deleteKid = (id) => {
    setKids((cur) => {
      const next = cur.filter((k) => k.id !== id);
      if (activeKidId === id && next.length) setActiveKidId(next[0].id);
      return next;
    });
    setKidEditor(null);
    showToast("Removed");
  };

  const openAddSitter = () => setSitterEditor({ id: null, name: "", phone: "", rate: "", notes: "", emoji: "🧑", isNew: true });
  const openEditSitter = (st) => setSitterEditor({ ...st, isNew: false });
  const saveSitter = (d) => {
    if (d.isNew) {
      setCaregivers((cur) => [...cur, { id: `s${Date.now()}`, name: d.name || "Sitter", phone: d.phone, rate: d.rate, notes: d.notes, emoji: d.emoji }]);
      showToast("Caregiver added");
    } else {
      setCaregivers((cur) => cur.map((s) => (s.id === d.id ? { ...s, name: d.name || s.name, phone: d.phone, rate: d.rate, notes: d.notes, emoji: d.emoji } : s)));
      showToast("Saved");
    }
    setSitterEditor(null);
  };
  const deleteSitter = (id) => {
    setCaregivers((cur) => cur.filter((s) => s.id !== id));
    setSitterEditor(null);
    showToast("Removed");
  };
  const shareWithSitter = async (sitter) => {
    const lines = itinerary.length
      ? itinerary.map((i) => `${formatHour(i.time)} — ${i.place.name} (${i.place.address || i.place.town})`).join("\n")
      : "";
    const napLine = napHour ? `Nap time: around ${formatHour(napHour)}\n` : "";
    const homeLine = homeBy ? `Home by: ${formatHour(homeBy)}\n` : "";
    const text = itinerary.length
      ? `Today's Little Day plan for the kids:\n${lines}\n${napLine}${homeLine}Thanks ${sitter.name}!`
      : `Hi ${sitter.name}! Sharing our Little Day app info — today's plan will follow.`;
    try {
      if (navigator.share) { await navigator.share({ title: "Today's plan", text }); return; }
    } catch (e) {}
    showToast(itinerary.length ? "Plan copied to share with your sitter" : "Build a day first to share a plan");
  };
  let content;
  if (screen === "welcome") {
    content = <WelcomeScreen onStart={() => { goTo("home"); if (!seenWelcome) setShowHowTo(true); setSeenWelcome(true); }} />;
  } else if (screen === "home") {
    content = (
      <HomeScreen
        setScreen={goTo}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        setSelectedPlace={handleSelectPlace}
        location={location}
        onRequestLocation={location.request}
        onSurprise={surpriseMe}
        kids={kids}
        activeKidId={activeKidId}
        onSetActive={setActiveKidId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onHowTo={() => setShowHowTo(true)}
        onSelectGoogle={setGooglePlace}
        companionKidIds={companionKidIds}
        onToggleCompanionKid={toggleCompanionKid}
        schoolDistrictId={schoolDistrictId}
        onSetSchoolDistrict={setSchoolDistrictId}
        completedDays={completedDays}
        onOpenBuilder={() => goTo("planner")}
      />
    );
  } else if (screen === "planner") {
    content = <PlannerScreen onBack={() => goTo("home")} onGenerate={handleGenerate} locationLabel={location.label} initialAge={ageToBand(ageFromBirthday(activeKid?.birthday))} activeKidName={activeKid?.name || ""} companionKids={kids.filter((k) => companionKidIds.includes(k.id))} />;
  } else if (screen === "planning") {
    content = <PlanningScreen onDone={() => setScreen("itinerary")} />;
  } else if (screen === "itinerary") {
    content = (
      <ItineraryScreen
        items={itinerary}
        onBack={() => goTo("planner")}
        setSelectedPlace={handleSelectPlace}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        onShare={shareCurrentDay}
        onInvite={() => setInvitePickerOpen(true)}
        homeBy={homeBy}
        napHour={napHour}
        onSave={saveCurrentDay}
        saved={currentDaySaved}
        weatherSwap={weatherSwap}
        onWeatherSwap={doWeatherSwap}
        onComplete={completeDay}
        completed={currentDayCompleted}
        onReshuffle={reshuffleItinerary}
      />
    );
  } else if (screen === "map") {
    content = <MapScreen setSelectedPlace={handleSelectPlace} favorites={favorites} toggleFavorite={toggleFavorite} location={location} onRequestLocation={location.request} initialQuery={searchQuery} />;
  } else if (screen === "favorites") {
    content = <FavoritesScreen favorites={favorites} setSelectedPlace={handleSelectPlace} toggleFavorite={toggleFavorite} savedDays={savedDays} onLoadDay={useSharedDay} onDeleteDay={deleteSavedDay} />;
  } else if (screen === "friends") {
    content = (
      <FriendsScreen
        onOpenInvite={() => setInviteOpen(true)}
        friends={friends}
        sharedDays={sharedDays}
        playDates={playDates}
        onAccept={acceptPlayDate}
        onDecline={declinePlayDate}
        onUseDay={useSharedDay}
        onAddFriend={addFriend}
        setSelectedPlace={handleSelectPlace}
        session={session}
        onSearchProfiles={searchRealProfiles}
        onAddRealFriend={addRealFriend}
        onOpenChat={(gid) => setChatGroupId(gid)}
      />
    );
  } else if (screen === "profile") {
    content = <ProfileScreen onOpenPremium={() => goTo("premium")} onOpenPassport={() => goTo("passport")} stats={stats} session={session} onOpenAuth={() => setAuthOpen(true)} onSignOut={signOut} earnedBadges={earnedBadges} kids={kids} activeKidId={activeKidId} onSetActive={setActiveKidId} onAddKid={openAddKid} onEditKid={openEditKid} sitters={sitters} onAddSitter={openAddSitter} onEditSitter={openEditSitter} onShareWithSitter={shareWithSitter}
      profileNames={profileNames} onSaveProfileNames={saveProfileNames}
      myCaregivers={myCaregivers} caregiverLinks={caregiverLinks} caregiverInvite={caregiverInvite}
      onCreateCaregiverInvite={createCaregiverInvite} onRemoveCaregiverAccess={removeCaregiverAccess}
      activeFamilyId={activeFamilyId} onSwitchFamily={switchFamily}
      favorites={favorites} savedDays={savedDays} onViewSaved={() => goTo("favorites")}
      forceEditNameToken={forceEditNameToken}
    />;
  } else if (screen === "safety") {
    content = <SafetyScreen />;
  } else if (screen === "community") {
    content = <CommunityScreen setSelectedPlace={handleSelectPlace} />;
  } else if (screen === "activities") {
    content = <ActivitiesScreen setSelectedPlace={handleSelectPlace} />;
  } else if (screen === "premium") {
    content = <PremiumScreen onBack={() => goTo("profile")} onUpgrade={() => showToast("Preview only — no charge. Subscriptions come with accounts.")} />;
  } else if (screen === "passport") {
    content = (
      <PassportScreen
        onBack={() => goTo("profile")}
        completedDays={completedDays}
        stats={stats}
        earnedBadges={earnedBadges}
        onShareDay={(rec) => setDayCard(rec)}
        onAddPhoto={addDayPhoto}
      />
    );
  } else if (screen === "place") {
    content = (
      <PlaceDetailScreen
        place={selectedPlace}
        onBack={() => setScreen(prevScreen)}
        favorited={favorites.includes(selectedPlace?.id)}
        onToggleFavorite={toggleFavorite}
        checkInCount={selectedPlace ? (checkIns[selectedPlace.id] || 0) : 0}
        onCheckIn={() => checkIn(selectedPlace)}
        surpriseMode={surpriseMode}
        onSurpriseAgain={surpriseMe}
        onSelectPlace={(p) => { setSelectedPlace(p); setSurpriseMode(false); }}
      />
    );
  }

  const showNav = ["home", "map", "friends", "favorites", "safety", "profile"].includes(screen);

  const [betaOk, setBetaOk] = usePersistentState("betaOk", false);
  // Sunrise plays once per fresh open (not on tab switches within a session).
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (window.sessionStorage.getItem("littleday.sawSunrise")) return false;
      window.sessionStorage.setItem("littleday.sawSunrise", "1");
      return true;
    } catch (e) { return true; }
  });
  if (showSplash) return <SunriseSplash onDone={() => setShowSplash(false)} />;
  if (!betaOk) return <BetaGate onUnlock={() => setBetaOk(true)} />;

  return (
    <ReviewsContext.Provider value={{ reviews, addReview }}>
    <NavContext.Provider value={{ goHome: () => { setSelectedPlace(null); setSurpriseMode(false); goTo("home"); } }}>
    <div
      className="min-h-screen flex justify-center"
      style={{
        backgroundColor: "#EFEAE0",
        fontFamily: "'Inter', sans-serif",
        "--accent": "#FF8C61",
        "--cta": "linear-gradient(135deg,#FF8C61,#FFC857)",
        "--bg": APP_BG,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        input[type="range"] { height: 4px; border-radius: 4px; background: #E7E1D4; }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes sunRise { from { transform: translateY(110px) scale(0.82); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes rayPop { from { transform: scale(0.25); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes glowUp { from { transform: translateY(90px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes splashOut { to { opacity: 0; transform: translateY(-24px); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sunFloat { from { opacity: 0; transform: translateY(18px) scale(0.85); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes sunBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes raysShimmer { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(760px) rotate(600deg); opacity: 0.9; } }
      `}</style>
      <div
        className="w-full flex flex-col relative"
        style={{ maxWidth: 420, height: "100dvh", backgroundColor: "var(--bg)" }}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div key={screen} style={{ animation: "fadeSlide 0.28s ease-out" }}>
            {content}
          </div>
        </div>
        {showNav && (
          <div style={{ position: "sticky", bottom: 0, zIndex: 20, flexShrink: 0 }}>
            <BottomNav screen={screen} setScreen={goTo} />
          </div>
        )}
        <Toast message={toast} />
        <FriendPickerSheet
          open={invitePickerOpen}
          friends={friends}
          onPick={inviteFriendToDay}
          onClose={() => setInvitePickerOpen(false)}
          contextLabel={itinerary[0] ? `Starting at ${itinerary[0].place.name}` : ""}
        />
        <CelebrationOverlay
          data={celebration}
          onClose={() => setCelebration(null)}
          onPassport={() => { setCelebration(null); goTo("passport"); }}
          onShare={(rec) => { setCelebration(null); setDayCard(rec); }}
        />
        <DayCardOverlay record={dayCard} onClose={() => setDayCard(null)} onShared={() => showToast("Shared — or screenshot to send!")} />
        <RewardOverlay data={reward} onClose={() => setReward(null)} />
        <HowToOverlay key={showHowTo ? "howto-open" : "howto-closed"} open={showHowTo} onClose={() => setShowHowTo(false)} />
        {kidEditor && (
          <KidEditorSheet key={kidEditor.id || "new"} data={kidEditor} onSave={saveKid} onDelete={deleteKid} onClose={() => setKidEditor(null)} />
        )}
        {sitterEditor && (
          <SitterEditorSheet key={sitterEditor.id || "snew"} data={sitterEditor} onSave={saveSitter} onDelete={deleteSitter} onClose={() => setSitterEditor(null)} />
        )}
        <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} session={session} />
        <GooglePlaceSheet place={googlePlace} onClose={() => setGooglePlace(null)} />
        <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} onShared={() => { setInviteOpen(false); showToast("Invite link shared!"); }} session={session} />
        <GroupChatSheet open={!!chatGroupId} groupId={chatGroupId} session={session} onClose={() => setChatGroupId(null)} />
      </div>
    </div>
    </NavContext.Provider>
    </ReviewsContext.Provider>
  );
}
