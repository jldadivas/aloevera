import React, { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin, Store, Tractor } from 'lucide-react'
import api from '../services/api'

const DEFAULT_CENTER = { lat: 14.5176, lng: 121.0509 } // TUP Taguig area fallback
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter'
]
const OVERPASS_COOLDOWN_MS = 12 * 60 * 1000
const OVERPASS_MIN_REQUEST_GAP_MS = 5000
const OVERPASS_TIMEOUT_MS = 6500
const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000
const SEARCH_CACHE_VERSION = 'v2'
const FARM_NEARBY_MAX_KM = 25
const SELLER_NEARBY_MAX_KM = 80
const endpointCooldown = new Map()
let lastOverpassRequestAt = 0
const PH_CURATED_FALLBACKS = {
  farm: [
    { place_id: 'ph-farm-1', name: 'The Good Food Urban Farm', lat: 14.5461, lon: 121.0860, display_name: 'The Good Food Urban Farm, Brgy. Ususan, Taguig, Metro Manila, Philippines' },
    { place_id: 'ph-farm-2', name: 'BGC Urban Farm', lat: 14.5489, lon: 121.0481, display_name: 'BGC Urban Farm, Bonifacio Global City, Taguig, Metro Manila, Philippines' },
    { place_id: 'ph-farm-3', name: 'Urban Roots', lat: 14.5790, lon: 121.0357, display_name: 'Urban Roots (indoor hydroponic microgreens farm), Metro Manila, Philippines' },
    { place_id: 'ph-farm-4', name: 'Sunnyville Community Farm', lat: 14.6760, lon: 121.0437, display_name: 'Sunnyville Community Farm, Quezon City, Metro Manila, Philippines' },
    { place_id: 'ph-farm-5', name: 'Kingspoint Joy of Urban Farming', lat: 14.7006, lon: 121.0209, display_name: 'Kingspoint Joy of Urban Farming, Quezon City, Metro Manila, Philippines' },
    { place_id: 'ph-farm-6', name: 'Women Food Producers Urban Garden', lat: 14.7062, lon: 121.1056, display_name: 'Women Food Producers Urban Garden, Payatas, Quezon City, Metro Manila, Philippines' },
    { place_id: 'ph-farm-7', name: 'Las Pinas Community Garden (Brgy. CAA)', lat: 14.4525, lon: 120.9932, display_name: 'Urban Gardening Community, Brgy. CAA, Las Pinas, Metro Manila, Philippines' },
    { place_id: 'ph-farm-8', name: 'Paranaque BF Homes Urban Garden', lat: 14.4687, lon: 121.0179, display_name: 'Urban Gardening Community, BF Homes Phase 3, Paranaque, Metro Manila, Philippines' },
    { place_id: 'ph-farm-9', name: 'Paranaque Don Bosco Urban Garden', lat: 14.4871, lon: 121.0221, display_name: 'Urban Gardening Community, Don Bosco, Paranaque, Metro Manila, Philippines' },
    { place_id: 'ph-farm-10', name: 'Muntinlupa Putatan Urban Garden', lat: 14.3784, lon: 121.0470, display_name: 'Urban Gardening Community, Putatan, Muntinlupa, Metro Manila, Philippines' },
    { place_id: 'ph-farm-11', name: 'Muntinlupa Sucat Urban Garden', lat: 14.4448, lon: 121.0453, display_name: 'Urban Gardening Community, Sucat, Muntinlupa, Metro Manila, Philippines' },
    { place_id: 'ph-farm-12', name: 'Sampaloc Urban Garden', lat: 14.6099, lon: 120.9959, display_name: 'Urban Gardening Community, Sampaloc, Manila, Philippines' },
    { place_id: 'ph-farm-13', name: 'Marikina Nangka Urban Garden', lat: 14.6836, lon: 121.0977, display_name: 'Urban Gardening Community, Nangka, Marikina, Metro Manila, Philippines' },
    { place_id: 'ph-farm-14', name: 'Marikina Concepcion Urban Garden', lat: 14.6499, lon: 121.1019, display_name: 'Urban Gardening Community, Concepcion, Marikina, Metro Manila, Philippines' },
    { place_id: 'ph-farm-15', name: 'Navotas Pasolo Urban Garden', lat: 14.6632, lon: 120.9494, display_name: 'Urban Gardening Community, Pasolo, Navotas, Metro Manila, Philippines' },
    { place_id: 'ph-farm-16', name: 'Navotas Tanza 1 Urban Garden', lat: 14.6777, lon: 120.9300, display_name: 'Urban Gardening Community, Tanza 1, Navotas, Metro Manila, Philippines' },
    { place_id: 'ph-farm-17', name: 'Navotas Tanza 2 Urban Garden', lat: 14.6765, lon: 120.9261, display_name: 'Urban Gardening Community, Tanza 2, Navotas, Metro Manila, Philippines' },
    { place_id: 'ph-farm-18', name: 'Flor\'s Garden and Nature Haven', lat: 14.6169, lon: 121.2372, display_name: 'Flor\'s Garden and Nature Haven, Rizal, Philippines' },
    { place_id: 'ph-farm-19', name: 'Pili Paninap Farm', lat: 14.7078, lon: 121.1780, display_name: 'Pili Paninap Farm, Rizal, Philippines' },
    { place_id: 'ph-farm-20', name: 'Terra Verde Ecofarm', lat: 14.1915, lon: 120.8794, display_name: 'Terra Verde Ecofarm, Cavite, Philippines' },
    { place_id: 'ph-farm-21', name: 'EMV Flower Farm', lat: 14.1730, lon: 120.9070, display_name: 'EMV Flower Farm, Cavite, Philippines' },
    { place_id: 'ph-farm-22', name: 'Luntiang Republika Ecofarm', lat: 14.2824, lon: 120.9059, display_name: 'Luntiang Republika Ecofarm, Cavite, Philippines' },
    { place_id: 'ph-farm-23', name: 'Farmshare Prime', lat: 14.2532, lon: 121.1574, display_name: 'Farmshare Prime, Laguna, Philippines' },
    { place_id: 'ph-farm-24', name: 'Silent Integrated Farm', lat: 14.1814, lon: 121.2198, display_name: 'Silent Integrated Farm, Laguna, Philippines' },
    { place_id: 'ph-farm-25', name: 'Graco Farms', lat: 14.2872, lon: 121.1221, display_name: 'Graco Farms, Laguna, Philippines' },
    { place_id: 'ph-farm-26', name: 'Milea Bee Farm', lat: 13.9520, lon: 121.1832, display_name: 'Milea Bee Farm, Batangas, Philippines' },
    { place_id: 'ph-farm-27', name: 'Don Leon Nature Farm', lat: 13.9142, lon: 121.0848, display_name: 'Don Leon Nature Farm, Batangas, Philippines' },
    { place_id: 'ph-farm-28', name: 'Paradizoo Farm', lat: 14.0684, lon: 120.9791, display_name: 'Paradizoo Farm, Mendez, Cavite, Philippines' },
    { place_id: 'ph-farm-29', name: 'Yoki Farm', lat: 15.0897, lon: 120.5922, display_name: 'Yoki Farm, Guagua, Pampanga, Philippines' },
    { place_id: 'ph-farm-30', name: 'Costales Nature Farms', lat: 14.1429, lon: 121.2508, display_name: 'Costales Nature Farms, Majayjay, Laguna, Philippines' },
    { place_id: 'ph-farm-31', name: 'Bahay Pastulan Farm', lat: 14.1794, lon: 121.1128, display_name: 'Bahay Pastulan Farm, Calauan, Laguna, Philippines' },
    { place_id: 'ph-farm-32', name: 'Amsinckia Urban Farm', lat: 14.5536, lon: 121.0518, display_name: 'Amsinckia Urban Farm, Taguig, Metro Manila, Philippines' },
    { place_id: 'ph-farm-33', name: 'Sonya\'s Garden Farm', lat: 14.1191, lon: 120.9070, display_name: 'Sonya\'s Garden Farm, Tagaytay area, Cavite, Philippines' },
    { place_id: 'ph-farm-34', name: 'Philippine Carabao Center Demo Farm', lat: 15.7282, lon: 120.9314, display_name: 'Philippine Carabao Center Demo Farm, Science City of Munoz, Nueva Ecija, Philippines' },
    { place_id: 'ph-farm-35', name: 'Northern Blossom Flower Farm', lat: 16.9568, lon: 120.7832, display_name: 'Northern Blossom Flower Farm, Atok, Benguet, Philippines' },
    { place_id: 'ph-farm-36', name: 'Gawad Kalinga Enchanted Farm', lat: 15.0137, lon: 120.7983, display_name: 'Gawad Kalinga Enchanted Farm, Angat, Bulacan, Philippines' },
    { place_id: 'ph-farm-37', name: 'Costales Farm School', lat: 14.1412, lon: 121.2469, display_name: 'Costales Farm School, Majayjay, Laguna, Philippines' },
    { place_id: 'ph-farm-38', name: 'Yardstick Farm', lat: 14.2148, lon: 121.0462, display_name: 'Yardstick Farm, Silang, Cavite, Philippines' },
    { place_id: 'ph-farm-39', name: 'Malagos Farm Area', lat: 7.1811, lon: 125.4381, display_name: 'Malagos Farm Area, Davao City, Philippines' },
    { place_id: 'ph-farm-40', name: 'Bukid Amara Farm', lat: 14.6298, lon: 121.3598, display_name: 'Bukid Amara Farm, Lucban, Quezon, Philippines' },
    { place_id: 'ph-farm-41', name: 'Dahilayan Agricultural Farm', lat: 8.1663, lon: 124.9448, display_name: 'Dahilayan Agricultural Farm, Bukidnon, Philippines' },
    { place_id: 'ph-farm-42', name: 'La Trinidad Strawberry Farm', lat: 16.4554, lon: 120.5883, display_name: 'La Trinidad Strawberry Farm, Benguet, Philippines' },
    { place_id: 'ph-farm-43', name: 'PhilRice Demonstration Farm', lat: 15.7275, lon: 120.9306, display_name: 'PhilRice Demonstration Farm, Science City of Munoz, Nueva Ecija, Philippines' },
    { place_id: 'ph-farm-44', name: 'MMDA Urban Garden (Makati)', lat: 14.5540, lon: 121.0241, display_name: 'MMDA Urban Garden, Makati, Metro Manila, Philippines' },
    { place_id: 'ph-farm-45', name: 'Taguig Community Urban Farm East', lat: 14.5352, lon: 121.0617, display_name: 'Community Urban Farm, Taguig East Zone, Metro Manila, Philippines' },
    { place_id: 'ph-farm-46', name: 'Quezon City Edible Garden Hub', lat: 14.6470, lon: 121.0509, display_name: 'Edible Garden Hub, Quezon City, Metro Manila, Philippines' },
    { place_id: 'ph-farm-47', name: 'Pasig Riverside Community Farm', lat: 14.5787, lon: 121.0895, display_name: 'Riverside Community Farm, Pasig, Metro Manila, Philippines' },
    { place_id: 'ph-farm-48', name: 'Makati Pocket Farm Garden', lat: 14.5602, lon: 121.0192, display_name: 'Pocket Farm Garden, Makati, Metro Manila, Philippines' },
    { place_id: 'ph-farm-49', name: 'Paranaque Urban Veggie Farm', lat: 14.4813, lon: 121.0198, display_name: 'Urban Veggie Farm, Paranaque, Metro Manila, Philippines' },
    { place_id: 'ph-farm-50', name: 'Marikina Riverbank Urban Farm', lat: 14.6465, lon: 121.1042, display_name: 'Riverbank Urban Farm, Marikina, Metro Manila, Philippines' }
  ],
  seller: [
    { place_id: 'ph-shop-1', name: 'UP Diliman Arboretum', lat: 14.6511, lon: 121.0670, display_name: 'University of the Philippines Arboretum, UP Diliman, Quezon City, Philippines' },
    { place_id: 'ph-shop-2', name: 'Ayala Triangle Gardens', lat: 14.5566, lon: 121.0237, display_name: 'Ayala Triangle Gardens, Makati CBD, Metro Manila, Philippines' },
    { place_id: 'ph-shop-3', name: 'Washington SyCip Park', lat: 14.5542, lon: 121.0188, display_name: 'Washington SyCip Park, Legazpi Village, Makati, Metro Manila, Philippines' },
    { place_id: 'ph-shop-4', name: 'Jaime C. Velasquez Park', lat: 14.5587, lon: 121.0247, display_name: 'Jaime C. Velasquez Park, Salcedo Village, Makati, Metro Manila, Philippines' },
    { place_id: 'ph-shop-5', name: 'Farmer\'s Garden Center', lat: 14.5887, lon: 121.0623, display_name: 'Farmer\'s Garden Center, Pasig, Metro Manila, Philippines' },
    { place_id: 'ph-shop-6', name: 'Balintawak Plant Market', lat: 14.6589, lon: 121.0051, display_name: 'Balintawak Plant Market, Quezon City, Metro Manila, Philippines' },
    { place_id: 'ph-shop-7', name: 'Cartimar Plant and Garden Shops', lat: 14.5558, lon: 120.9978, display_name: 'Cartimar Plant and Garden Shops, Pasay, Metro Manila, Philippines' },
    { place_id: 'ph-shop-8', name: 'Dangwa Market Plant Stalls', lat: 14.6184, lon: 120.9948, display_name: 'Dangwa Market Plant Stalls, Manila, Philippines' },
    { place_id: 'ph-shop-9', name: 'Taguig Plant and Garden Supplies', lat: 14.5178, lon: 121.0502, display_name: 'Taguig Plant and Garden Supplies, Taguig, Metro Manila, Philippines' },
    { place_id: 'ph-shop-10', name: 'La Mesa Ecopark Plant Area', lat: 14.7160, lon: 121.0735, display_name: 'La Mesa Ecopark plant area, Quezon City, Philippines' },
    { place_id: 'ph-shop-11', name: 'Ninoy Aquino Parks and Wildlife Center', lat: 14.6502, lon: 121.0403, display_name: 'Ninoy Aquino Parks and Wildlife Center, Quezon City, Philippines' },
    { place_id: 'ph-shop-12', name: 'Rizal Park Gardens', lat: 14.5825, lon: 120.9795, display_name: 'Rizal Park Gardens, Manila, Philippines' },
    { place_id: 'ph-shop-13', name: 'Arroceros Forest Park', lat: 14.5922, lon: 120.9826, display_name: 'Arroceros Forest Park, Manila, Philippines' },
    { place_id: 'ph-shop-14', name: 'Cebu City Flower and Plant Market', lat: 10.3104, lon: 123.8915, display_name: 'Cebu City Flower and Plant Market, Cebu City, Philippines' },
    { place_id: 'ph-shop-15', name: 'Davao Crocodile Park Gardens', lat: 7.1030, lon: 125.6183, display_name: 'Davao Crocodile Park Gardens, Davao City, Philippines' },
    { place_id: 'ph-shop-16', name: 'Iloilo Esplanade Planting Zone', lat: 10.7068, lon: 122.5605, display_name: 'Iloilo Esplanade planting zone, Iloilo City, Philippines' },
    { place_id: 'ph-shop-17', name: 'Baguio Orchidarium', lat: 16.4119, lon: 120.5971, display_name: 'Baguio Orchidarium, Burnham area, Baguio, Philippines' },
    { place_id: 'ph-shop-18', name: 'Cagayan de Oro Garden Center Area', lat: 8.4542, lon: 124.6319, display_name: 'Garden center area, Cagayan de Oro, Philippines' }
  ]
}

const getQueryLabel = (mode) => (mode === 'farm' ? 'farm' : 'garden shop')

const getQueryCandidates = (mode, areaHint = '') => {
  const base = mode === 'farm'
    ? ['farm', 'organic farm', 'nursery']
    : ['garden center', 'plant shop', 'agri supply']

  const area = (areaHint || '').trim()
  const withArea = area ? base.map((item) => `${item} ${area}`) : base
  return withArea.slice(0, 2)
}

const buildViewBox = (lat, lng, delta = 0.35) => ({
  left: lng - delta,
  right: lng + delta,
  top: lat + delta,
  bottom: lat - delta
})

const toRad = (deg) => (deg * Math.PI) / 180
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const buildOverpassQuery = (mode, lat, lng, radiusMeters = 22000) => {
  const sellerBlocks = [
    `node(around:${radiusMeters},${lat},${lng})["shop"~"garden_centre|florist|herbalist|health_food|farm|general"];`,
    `way(around:${radiusMeters},${lat},${lng})["shop"~"garden_centre|florist|herbalist|health_food|farm|general"];`,
    `relation(around:${radiusMeters},${lat},${lng})["shop"~"garden_centre|florist|herbalist|health_food|farm|general"];`,
    `node(around:${radiusMeters},${lat},${lng})["shop"~"agrarian|supermarket|convenience"];`,
    `way(around:${radiusMeters},${lat},${lng})["shop"~"agrarian|supermarket|convenience"];`,
    `node(around:${radiusMeters},${lat},${lng})["amenity"="marketplace"];`,
    `way(around:${radiusMeters},${lat},${lng})["amenity"="marketplace"];`,
    `relation(around:${radiusMeters},${lat},${lng})["amenity"="marketplace"];`,
    `node(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`,
    `way(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`,
    `relation(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`
  ]

  const farmBlocks = [
    `node(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`,
    `way(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`,
    `relation(around:${radiusMeters},${lat},${lng})["name"~"farm|garden|nursery|agri|seed",i];`,
    `node(around:${radiusMeters},${lat},${lng})["landuse"~"farmland|farmyard|greenhouse_horticulture"];`,
    `way(around:${radiusMeters},${lat},${lng})["landuse"~"farmland|farmyard|greenhouse_horticulture"];`,
    `relation(around:${radiusMeters},${lat},${lng})["landuse"~"farmland|farmyard|greenhouse_horticulture"];`,
    `node(around:${radiusMeters},${lat},${lng})["building"~"greenhouse|farm_auxiliary"];`,
    `way(around:${radiusMeters},${lat},${lng})["building"~"greenhouse|farm_auxiliary"];`
  ]

  const blocks = mode === 'farm' ? farmBlocks : sellerBlocks
  return `
    [out:json][timeout:12];
    (
      ${blocks.join('\n')}
    );
    out center tags;
  `
}

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return res
  } finally {
    clearTimeout(timer)
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const searchOverpassWithFallbackEndpoints = async (queryText) => {
  let lastErr = null
  const now = Date.now()
  const sinceLast = now - lastOverpassRequestAt
  if (sinceLast < OVERPASS_MIN_REQUEST_GAP_MS) {
    await sleep(OVERPASS_MIN_REQUEST_GAP_MS - sinceLast)
  }

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i += 1) {
    const endpoint = OVERPASS_ENDPOINTS[i]
    const cooldownUntil = endpointCooldown.get(endpoint) || 0
    if (Date.now() < cooldownUntil) continue

    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: 'application/json'
        },
        body: queryText
      }, OVERPASS_TIMEOUT_MS)
      lastOverpassRequestAt = Date.now()

      // treat server overload as retryable
      if ([429, 502, 503, 504].includes(res.status)) {
        lastErr = new Error(`Overpass busy (${res.status})`)
        if (res.status === 429 || res.status === 503 || res.status === 504) {
          endpointCooldown.set(endpoint, Date.now() + OVERPASS_COOLDOWN_MS)
        }
        continue
      }
      if (!res.ok) {
        lastErr = new Error(`Overpass failed (${res.status})`)
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const json = await res.json()
      return json
    } catch (err) {
      lastErr = err
      endpointCooldown.set(endpoint, Date.now() + Math.floor(OVERPASS_COOLDOWN_MS / 2))
    }
  }
  throw (lastErr || new Error('All Overpass endpoints failed'))
}

const mapOverpassElements = (elements, originLat, originLng) => {
  const rows = (elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat === undefined || lon === undefined) return null
      const tags = el.tags || {}
      const name =
        tags.name ||
        tags.brand ||
        tags.official_name ||
        tags.operator ||
        'Aloe-related location'
      const details = [
        tags.shop ? `shop: ${tags.shop}` : '',
        tags.landuse ? `landuse: ${tags.landuse}` : '',
        tags.amenity ? `amenity: ${tags.amenity}` : '',
        tags.farm ? `farm: ${tags.farm}` : '',
        tags.addr_full || '',
        tags['addr:street'] || '',
        tags['addr:city'] || '',
        tags['addr:province'] || ''
      ].filter(Boolean).join(', ')

      const d = distanceKm(originLat, originLng, Number(lat), Number(lon))
      return {
        place_id: `${el.type}-${el.id}`,
        lat: Number(lat),
        lon: Number(lon),
        display_name: details ? `${name}, ${details}` : name,
        name,
        distance_km: d,
        tags
      }
    })
    .filter(Boolean)

  const unique = Array.from(new Map(rows.map((r) => [r.place_id, r])).values())
  unique.sort((a, b) => a.distance_km - b.distance_km)
  return unique.slice(0, 40)
}

const filterRowsByMode = (rows = [], mode = 'farm') => {
  if (mode !== 'farm') return rows

  return rows.filter((row) => {
    const tags = row.tags || {}
    const haystack = `${row.name || ''} ${row.display_name || ''}`.toLowerCase()
    const shopTag = String(tags.shop || '').toLowerCase()
    const amenityTag = String(tags.amenity || '').toLowerCase()
    const landuseTag = String(tags.landuse || '').toLowerCase()
    const buildingTag = String(tags.building || '').toLowerCase()
    const classTag = String(row.class || '').toLowerCase()
    const typeTag = String(row.type || '').toLowerCase()

    const hasFarmSignals =
      /farm|farmland|farmyard|agri|agriculture|greenhouse|nursery/.test(haystack) ||
      ['farmland', 'farmyard', 'greenhouse_horticulture'].includes(landuseTag) ||
      ['greenhouse', 'farm_auxiliary'].includes(buildingTag) ||
      classTag === 'landuse' ||
      typeTag === 'farmland'

    const isLikelyShop =
      /shop|store|mall|market|mart|center|centre|florist/.test(haystack) ||
      ['garden_centre', 'florist', 'herbalist', 'health_food', 'general', 'convenience', 'supermarket', 'agrarian'].includes(shopTag) ||
      amenityTag === 'marketplace'

    if (isLikelyShop && !hasFarmSignals) return false
    return true
  })
}

const applyDistanceWindow = (rows = [], originLat, originLng, mode = 'farm') => {
  const maxKm = mode === 'farm' ? FARM_NEARBY_MAX_KM : SELLER_NEARBY_MAX_KM
  const withDistance = rows
    .map((row) => {
      const lat = Number(row.lat)
      const lon = Number(row.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      const d = Number.isFinite(Number(row.distance_km))
        ? Number(row.distance_km)
        : distanceKm(originLat, originLng, lat, lon)
      return { ...row, lat, lon, distance_km: d }
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_km - b.distance_km)

  return withDistance.filter((row) => row.distance_km <= maxKm)
}

const buildCuratedFallbackRows = (lat, lng, mode = 'farm') => {
  const pool = PH_CURATED_FALLBACKS[mode] || []
  return pool
    .map((row) => ({
      ...row,
      distance_km: distanceKm(lat, lng, Number(row.lat), Number(row.lon))
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 20)
}

const mergeFarmRowsWithCurated = (rows = [], lat, lng) => {
  const curatedRows = buildCuratedFallbackRows(lat, lng, 'farm')
  const combined = [...rows, ...curatedRows]
  const withDistance = combined
    .map((row) => {
      const rowLat = Number(row.lat)
      const rowLon = Number(row.lon)
      if (!Number.isFinite(rowLat) || !Number.isFinite(rowLon)) return null
      return {
        ...row,
        lat: rowLat,
        lon: rowLon,
        distance_km: Number.isFinite(Number(row.distance_km))
          ? Number(row.distance_km)
          : distanceKm(lat, lng, rowLat, rowLon)
      }
    })
    .filter(Boolean)

  const unique = Array.from(
    new Map(
      withDistance.map((row) => [
        String((row.name || row.display_name || row.place_id || '')).toLowerCase(),
        row
      ])
    ).values()
  )

  unique.sort((a, b) => a.distance_km - b.distance_km)
  return unique.slice(0, 40)
}

export default function AloeMap() {
  const mapRootRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const routeLayerRef = useRef(null)

  const [mode, setMode] = useState('farm')
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchLabel, setSearchLabel] = useState('Current area')
  const [leafletReady, setLeafletReady] = useState(false)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (!window.L || !mapRootRef.current) return
    setLeafletReady(true)

    if (!mapRef.current) {
      const map = window.L.map(mapRootRef.current, { zoomControl: true }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      markerLayerRef.current = window.L.layerGroup().addTo(map)
      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerLayerRef.current = null
      }
    }
  }, [])

  const renderMarkers = (rows) => {
    if (!window.L || !mapRef.current || !markerLayerRef.current) return
    markerLayerRef.current.clearLayers()

    rows.forEach((row) => {
      const marker = window.L.marker([Number(row.lat), Number(row.lon)])
      marker.bindPopup(
        `<strong>${row.display_name?.split(',')[0] || 'Aloe Location'}</strong><br/>${row.display_name || ''}`
      )
      marker.addTo(markerLayerRef.current)
    })
  }

  const clearRoute = () => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    setRouteInfo(null)
  }

  const showDirectionsInMap = async (place) => {
    if (!window.L || !mapRef.current) return
    const originLat = Number(center.lat)
    const originLng = Number(center.lng)
    const destLat = Number(place.lat)
    const destLng = Number(place.lon)
    if (![originLat, originLng, destLat, destLng].every((v) => Number.isFinite(v))) return

    setRouteLoading(true)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
      const res = await fetchWithTimeout(osrmUrl, { method: 'GET', headers: { Accept: 'application/json' } }, 12000)
      if (!res.ok) throw new Error(`Routing failed (${res.status})`)
      const data = await res.json()
      const route = data?.routes?.[0]
      if (!route?.geometry?.coordinates?.length) throw new Error('No route found')

      const latLngs = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
      clearRoute()
      routeLayerRef.current = window.L.polyline(latLngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.9
      }).addTo(mapRef.current)
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [34, 34] })

      setRouteInfo({
        placeName: place.name || place.display_name?.split(',')[0] || 'Aloe location',
        distanceKm: Number(route.distance || 0) / 1000,
        durationMin: Number(route.duration || 0) / 60
      })
      setNotice('')
    } catch (_) {
      // Fallback to straight-line route so user still gets in-app guidance.
      clearRoute()
      routeLayerRef.current = window.L.polyline(
        [[originLat, originLng], [destLat, destLng]],
        { color: '#1f7a46', weight: 4, dashArray: '8 8', opacity: 0.95 }
      ).addTo(mapRef.current)
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [34, 34] })
      const approxKm = distanceKm(originLat, originLng, destLat, destLng)
      setRouteInfo({
        placeName: place.name || place.display_name?.split(',')[0] || 'Aloe location',
        distanceKm: approxKm,
        durationMin: (approxKm / 30) * 60
      })
      setNotice('Routing service unavailable. Showing approximate straight-line direction.')
    } finally {
      setRouteLoading(false)
    }
  }

  const searchNominatim = async ({ q, box, bounded = true, limit = 25 }) => {
    const params = {
      q,
      limit: Number(limit) || 25,
      countrycodes: 'ph'
    }
    if (box) params.viewbox = `${box.left},${box.top},${box.right},${box.bottom}`
    if (bounded) params.bounded = '1'

    const res = await api.get('/map/search', { params })
    const rows = res.data?.data?.rows
    return Array.isArray(rows) ? rows : []
  }

  const fetchNearby = async (lat, lng, targetMode, areaHint = '') => {
    try {
      setLoading(true)
      setError('')
      setNotice('')
      const cacheKey = `farm_map:${SEARCH_CACHE_VERSION}:${targetMode}:${lat.toFixed(2)}:${lng.toFixed(2)}:${(areaHint || '').toLowerCase()}`
      const cachedRaw = sessionStorage.getItem(cacheKey)
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw)
          if (
            cached?.timestamp &&
            Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS &&
            Array.isArray(cached.rows) &&
            cached.rows.length > 0
          ) {
            setPlaces(cached.rows)
            renderMarkers(cached.rows)
            if (mapRef.current) mapRef.current.setView([lat, lng], 12)
            setLoading(false)
            return
          }
        } catch (_) {
          // ignore bad cache entry
        }
      }
      // Free-tier friendly: keep Overpass calls minimal and fallback faster.
      const radii = [8000, 18000]
      let normalized = []
      let overpassFailed = false

      for (let idx = 0; idx < radii.length; idx += 1) {
        const radius = radii[idx]
        try {
          const overpassQuery = buildOverpassQuery(targetMode, lat, lng, radius)
          // eslint-disable-next-line no-await-in-loop
          const overpassJson = await searchOverpassWithFallbackEndpoints(overpassQuery)
          const rows = applyDistanceWindow(
            filterRowsByMode(mapOverpassElements(overpassJson.elements, lat, lng), targetMode),
            lat,
            lng,
            targetMode
          )
          if (rows.length) {
            normalized = rows.slice(0, 20)
            break
          }
        } catch (_) {
          overpassFailed = true
          // Keep provider load low: stop retrying after first failure.
          if (idx === 0) break
        }
      }

      // fallback to Nominatim keyword search if OSM POI tags are sparse
      if (!normalized.length) {
        const box = buildViewBox(lat, lng)
        const queries = getQueryCandidates(targetMode, areaHint)
        let results = []
        for (let i = 0; i < queries.length; i += 1) {
          const q = queries[i]
          // eslint-disable-next-line no-await-in-loop
          let rows = await searchNominatim({ q, box, bounded: true, limit: 12 })
          if (!rows.length && i < 2) {
            // broaden search when local bounded results are sparse
            // eslint-disable-next-line no-await-in-loop
            rows = await searchNominatim({ q, box, bounded: false, limit: 18 })
          }
          if (rows.length) {
            const filtered = rows.filter((r) => {
              const klass = String(r.class || '').toLowerCase()
              const type = String(r.type || '').toLowerCase()
              // prevent street-only results
              if (klass === 'highway' || type === 'road' || type === 'residential' || type === 'footway') return false
              return true
            })
            const nearbyRows = applyDistanceWindow(
              filterRowsByMode(filtered, targetMode),
              lat,
              lng,
              targetMode
            )
            results = [...results, ...nearbyRows]
            if (results.length >= 24) break
          }
        }
        normalized = Array.from(new Map(results.map((r) => [String(r.place_id), r])).values()).slice(0, 30)
      }

      // In dense urban areas, strict farm tags can be empty.
      // Gracefully fallback to nearby aloe sellers/suppliers so users still get useful places.
      if (!normalized.length && targetMode === 'farm') {
        // Try nearby seller/shop tags from Overpass before text geocoder fallback.
        for (let idx = 0; idx < radii.length; idx += 1) {
          const radius = radii[idx]
          try {
            const sellerOverpassQuery = buildOverpassQuery('seller', lat, lng, radius)
            // eslint-disable-next-line no-await-in-loop
            const sellerOverpassJson = await searchOverpassWithFallbackEndpoints(sellerOverpassQuery)
            const sellerRows = applyDistanceWindow(
              mapOverpassElements(sellerOverpassJson.elements, lat, lng),
              lat,
              lng,
              'seller'
            )
            if (sellerRows.length) {
              normalized = sellerRows.slice(0, 20)
              setNotice('No farm-tagged locations found nearby. Showing closest aloe shops/suppliers.')
              break
            }
          } catch (_) {
            // Keep provider load low: stop retrying after first failure.
            if (idx === 0) break
          }
        }
      }

      if (!normalized.length && targetMode === 'farm') {
        const sellerQueries = getQueryCandidates('seller', areaHint)
        let sellerResults = []

        for (let i = 0; i < sellerQueries.length; i += 1) {
          const q = sellerQueries[i]
          // eslint-disable-next-line no-await-in-loop
          let rows = await searchNominatim({ q, box: buildViewBox(lat, lng), bounded: true, limit: 8 })
          if (!rows.length && i < 2) {
            // eslint-disable-next-line no-await-in-loop
            rows = await searchNominatim({ q, box: buildViewBox(lat, lng), bounded: false, limit: 8 })
          }
          if (rows.length) {
            const filtered = rows.filter((r) => {
              const klass = String(r.class || '').toLowerCase()
              const type = String(r.type || '').toLowerCase()
              if (klass === 'highway' || type === 'road' || type === 'residential' || type === 'footway') return false
              return true
            })
            const nearbySellerRows = applyDistanceWindow(filtered, lat, lng, 'seller')
            sellerResults = [...sellerResults, ...nearbySellerRows]
            if (sellerResults.length >= 12) break
          }
        }

        const fallbackShops = Array.from(new Map(sellerResults.map((r) => [String(r.place_id), r])).values()).slice(0, 12)
        if (fallbackShops.length) {
          normalized = fallbackShops
          setNotice('No farm-tagged locations found nearby. Showing closest aloe shops/suppliers.')
        }
      }

      // Last-resort free-tier fallback: fetch PH-wide aloe-related places
      // and sort by distance to user so something useful is still displayed.
      if (!normalized.length) {
        const broadQueries = targetMode === 'farm'
          ? ['farm philippines', 'plant nursery philippines']
          : ['garden center philippines', 'plant shop philippines']
        let broadRows = []

        for (const q of broadQueries) {
          // eslint-disable-next-line no-await-in-loop
          const rows = await searchNominatim({ q, bounded: false, limit: 25 })
          if (rows.length) {
            broadRows = [...broadRows, ...rows]
          }
          if (broadRows.length >= 40) break
        }

        const filteredBroadRows = broadRows.filter((r) => {
          const text = `${r.display_name || ''} ${r.class || ''} ${r.type || ''}`.toLowerCase()
          if (!/philippines/.test(text)) return false
          if (/highway|road|residential|footway/.test(text)) return false
          return /farm|nursery|garden|agri|seed|shop|supply|market/.test(text)
        })

        const deduped = Array.from(new Map(filteredBroadRows.map((r) => [String(r.place_id), r])).values())
        const withDistance = deduped
          .map((row) => {
            const rowLat = Number(row.lat)
            const rowLon = Number(row.lon)
            if (!Number.isFinite(rowLat) || !Number.isFinite(rowLon)) return null
            return {
              ...row,
              lat: rowLat,
              lon: rowLon,
              distance_km: distanceKm(lat, lng, rowLat, rowLon)
            }
          })
          .filter(Boolean)
          .sort((a, b) => a.distance_km - b.distance_km)
          .slice(0, 20)

        if (withDistance.length) {
          normalized = withDistance
          setNotice('Live nearby sources are busy. Showing closest available Philippines fallback results.')
        }
      }

      if (!normalized.length && overpassFailed) {
        setNotice('Primary map source is currently busy. Showing available fallback results.')
      } else if (!normalized.length && targetMode === 'farm') {
        setNotice('No mapped farms found within ~25km of your location. Try Aloe Shops or another nearby city.')
      }

      if (!normalized.length) {
        normalized = buildCuratedFallbackRows(lat, lng, targetMode)
        if (normalized.length) {
          setNotice('Live map providers are limited right now. Showing curated Philippines fallback locations.')
        }
      }

      if (targetMode === 'farm' && normalized.length) {
        normalized = mergeFarmRowsWithCurated(normalized, lat, lng)
      }

      setPlaces(normalized)
      renderMarkers(normalized)
      clearRoute()
      if (normalized.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), rows: normalized }))
      }
      if (mapRef.current) mapRef.current.setView([lat, lng], 12)
    } catch (err) {
      setError(err.message || 'Failed to load map results')
      setNotice('')
      setPlaces([])
      renderMarkers([])
    } finally {
      setLoading(false)
    }
  }

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      return
    }
    setError('')
    setNotice('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(next)
        setSearchLabel('Current area')
        fetchNearby(next.lat, next.lng, mode, '')
      },
      () => {
        setError('Unable to get your location. Showing default area.')
        fetchNearby(center.lat, center.lng, mode, '')
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  useEffect(() => {
    if (!leafletReady) return
    const areaHint = searchLabel === 'Current area' ? '' : searchLabel
    fetchNearby(center.lat, center.lng, mode, areaHint)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, leafletReady])

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[linear-gradient(180deg,#edf6ef_0%,#f7fbf8_100%)] px-4 py-5 text-[#1c3f2d] lg:px-6">
      <div className="mx-auto max-w-[1360px]">
        <section className="rounded-2xl border border-[#cfe2d5] bg-white p-4 shadow-[0_12px_26px_rgba(10,33,21,0.08)] lg:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1a3f2c]">Aloe Location Map</h1>
              <p className="text-sm text-[#557363]">Find nearby aloe vera farms and aloe vera seller/shop locations in your area.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="inline-flex rounded-xl border border-[#c9decf] bg-[#f3faf5] p-1">
                <button
                  type="button"
                  onClick={() => setMode('farm')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'farm' ? 'bg-[#2d754d] text-white' : 'text-[#315a44]'}`}
                >
                  <Tractor size={15} />
                  Farms
                </button>
                <button
                  type="button"
                  onClick={() => setMode('seller')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'seller' ? 'bg-[#2d754d] text-white' : 'text-[#315a44]'}`}
                >
                  <Store size={15} />
                  Aloe Shops
                </button>
              </div>
              <button
                type="button"
                onClick={detectCurrentLocation}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#bcd6c4] bg-[#ecf7f0] px-4 text-sm font-bold text-[#2a6545]"
              >
                <LocateFixed size={15} />
                Use My Location
              </button>
            </div>
          </div>

          {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {!error && notice && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-hidden rounded-2xl border border-[#cfe2d5] bg-[#eff6f1]">
              <div ref={mapRootRef} className="h-[560px] w-full" />
            </div>
            <aside className="rounded-2xl border border-[#cfe2d5] bg-[#f8fcf9] p-3">
              <div className="mb-2 border-b border-[#dceae0] pb-2">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5a7867]">Search Context</p>
                <p className="mt-1 text-sm font-semibold text-[#244734]">{searchLabel}</p>
                <p className="mt-0.5 text-xs text-[#63806f]">{mode === 'farm' ? 'Aloe farm mapping' : 'Aloe seller/location mapping'}</p>
                {routeInfo && (
                  <div className="mt-2 rounded-lg border border-[#cddfec] bg-[#eff6ff] px-2.5 py-2 text-xs text-[#1e3a5f]">
                    <p className="font-bold text-[#214d7d]">Route to {routeInfo.placeName}</p>
                    <p className="mt-0.5">Distance: {routeInfo.distanceKm.toFixed(1)} km</p>
                    <p>ETA: ~{Math.max(1, Math.round(routeInfo.durationMin))} min (driving)</p>
                    <button
                      type="button"
                      onClick={clearRoute}
                      className="mt-1.5 inline-flex items-center rounded-md border border-[#93b7df] bg-white px-2 py-1 text-[11px] font-bold text-[#1f4d7a]"
                    >
                      Clear Route
                    </button>
                  </div>
                )}
              </div>
              <div className="max-h-[470px] space-y-2 overflow-y-auto pr-1">
                {loading && <div className="rounded-lg border border-[#d6e7dc] bg-white px-3 py-2 text-sm text-[#4f6e5d]">Loading locations...</div>}
                {!loading && routeLoading && <div className="rounded-lg border border-[#dbe6f3] bg-[#f4f8fd] px-3 py-2 text-sm text-[#385676]">Calculating route...</div>}
                {!loading && places.length === 0 && (
                  <div className="rounded-lg border border-[#d6e7dc] bg-white px-3 py-2 text-sm text-[#4f6e5d]">No results found for this area.</div>
                )}
                {!loading && places.map((place, idx) => (
                  <div
                    key={`${place.place_id}-${idx}`}
                    onClick={() => mapRef.current?.setView([Number(place.lat), Number(place.lon)], 15)}
                    className="w-full cursor-pointer rounded-xl border border-[#d7e8de] bg-white px-3 py-2 text-left transition-colors hover:bg-[#eef7f1]"
                  >
                    <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1f4933]">
                      <MapPin size={14} />
                      {place.name || place.display_name?.split(',')[0] || 'Aloe location'}
                    </div>
                    {typeof place.distance_km === 'number' && (
                      <div className="mt-1 text-[11px] font-semibold text-[#2f6a48]">~{place.distance_km.toFixed(1)} km away</div>
                    )}
                    <div className="mt-1 text-xs leading-relaxed text-[#587666]">{place.display_name}</div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          showDirectionsInMap(place)
                        }}
                        className="inline-flex items-center rounded-lg border border-[#2f754f] bg-[#2f754f] px-2.5 py-1.5 text-[11px] font-bold text-white"
                      >
                        Show Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
