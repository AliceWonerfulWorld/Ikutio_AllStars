import { NextRequest, NextResponse } from 'next/server';

interface WeatherData {
  location: string;
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  description: string;
}

// 天気タイプの型定義
type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: '緯度と経度が必要です' },
        { status: 400 }
      );
    }

    // より正確な位置情報を取得
    const locationName = await getDetailedLocation(parseFloat(lat), parseFloat(lng));
    
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeatherMap API key not found, using mock data');
      return getMockWeatherData(parseFloat(lat), parseFloat(lng), locationName);
    }

    // OpenWeatherMap APIから天気情報を取得
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`;
    
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return getMockWeatherData(parseFloat(lat), parseFloat(lng), locationName);
    }

    const data = await response.json();
    
    // 天気コードを日本語の天気タイプに変換
    const weatherType = convertWeatherCode(data.weather[0].id);
    
    const weatherData: WeatherData = {
      location: locationName, // より正確な日本語住所を使用
      weather: weatherType,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10, // m/sに変換
      visibility: Math.round((data.visibility || 10000) / 1000), // kmに変換
      description: data.weather[0].description,
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Weather API error:', error);
    
    // エラー時はモックデータを返す
    const lat = parseFloat(searchParams.get('lat') || '35.681236');
    const lng = parseFloat(searchParams.get('lng') || '139.767125');
    const locationName = await getDetailedLocation(lat, lng);
    return getMockWeatherData(lat, lng, locationName);
  }
}

// より詳細な位置情報を取得する関数
async function getDetailedLocation(lat: number, lng: number): Promise<string> {
  try {
    // Google Geocoding APIを使用して詳細な住所を取得
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=ja&region=jp`;
      
      const response = await fetch(geocodingUrl);
      if (response.ok) {
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // 日本語の住所を取得
          const result = data.results[0];
          const addressComponents = result.address_components;
          
          let prefecture = '';
          let city = '';
          let town = '';
          let streetNumber = '';
          
          // 住所コンポーネントを解析
          for (const component of addressComponents) {
            const types = component.types;
            
            if (types.includes('administrative_area_level_1')) {
              prefecture = component.long_name.replace('都', '').replace('府', '').replace('県', '');
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name.replace('市', '').replace('区', '');
            } else if (types.includes('sublocality') || types.includes('administrative_area_level_3')) {
              town = component.long_name;
            } else if (types.includes('premise') || types.includes('street_number')) {
              streetNumber = component.long_name;
            }
          }
          
          // 住所を組み立て
          let address = '';
          if (prefecture) address += prefecture + '県';
          if (city) address += city + '市';
          if (town) address += town;
          if (streetNumber) address += streetNumber;
          
          if (address) {
            return address;
          }
          
          // フォールバック: formatted_addressから抽出
          const formattedAddress = result.formatted_address;
          return extractJapaneseAddress(formattedAddress);
        }
      }
    }
    
    // Google APIが利用できない場合は簡易的な地域判定
    return getLocationNameByCoordinates(lat, lng);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return getLocationNameByCoordinates(lat, lng);
  }
}

// フォーマットされた住所から日本語住所を抽出
function extractJapaneseAddress(formattedAddress: string): string {
  // 日本語の住所パターンを抽出
  const match = formattedAddress.match(/(.+?[都道府県])(.+?[市区町村])(.+?[町丁目])/);
  if (match) {
    return match[1] + match[2] + match[3];
  }
  
  // より簡単なパターン
  const simpleMatch = formattedAddress.match(/(.+?[都道府県])(.+?[市区町村])/);
  if (simpleMatch) {
    return simpleMatch[1] + simpleMatch[2];
  }
  
  return formattedAddress;
}

// 座標から簡易的な住所を推定
function getLocationNameByCoordinates(lat: number, lng: number): string {
  // 福岡県福岡市西区下山門周辺の詳細判定
  if (lat >= 33.57 && lat <= 33.58 && lng >= 130.31 && lng <= 130.32) {
    return "福岡県福岡市西区下山門";
  }
  
  // その他の地域判定
  if (lat >= 35.67 && lat <= 35.70 && lng >= 139.76 && lng <= 139.78) {
    return "東京都千代田区";
  } else if (lat >= 34.68 && lat <= 34.70 && lng >= 135.49 && lng <= 135.51) {
    return "大阪府大阪市北区";
  } else if (lat >= 35.16 && lat <= 35.18 && lng >= 136.89 && lng <= 136.91) {
    return "愛知県名古屋市中区";
  } else if (lat >= 33.58 && lat <= 33.60 && lng >= 130.40 && lng <= 130.42) {
    return "福岡県福岡市中央区";
  } else if (lat >= 43.06 && lat <= 43.08 && lng >= 141.34 && lng <= 141.36) {
    return "北海道札幌市中央区";
  }
  
  return `緯度${lat.toFixed(4)}, 経度${lng.toFixed(4)}`;
}

// 天気コードを天気タイプに変換
function convertWeatherCode(weatherId: number): WeatherType {
  if (weatherId >= 200 && weatherId < 300) return 'stormy'; // 雷雨
  if (weatherId >= 300 && weatherId < 400) return 'rainy'; // 霧雨
  if (weatherId >= 500 && weatherId < 600) return 'rainy'; // 雨
  if (weatherId >= 600 && weatherId < 700) return 'snowy'; // 雪
  if (weatherId >= 700 && weatherId < 800) return 'cloudy'; // 大気現象
  if (weatherId === 800) return 'sunny'; // 晴れ
  if (weatherId >= 801 && weatherId < 900) return 'cloudy'; // 曇り
  return 'cloudy'; // デフォルト
}

// モックデータを生成
function getMockWeatherData(lat: number, lng: number, locationName: string): NextResponse {
  const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy'];
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  
  const mockData: WeatherData = {
    location: locationName,
    weather: randomWeather,
    temperature: Math.floor(Math.random() * 30) + 5, // 5-35度
    humidity: Math.floor(Math.random() * 60) + 30, // 30-90%
    windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 m/s
    visibility: Math.floor(Math.random() * 15) + 5, // 5-20 km
    description: getWeatherDescription(randomWeather),
  };

  return NextResponse.json(mockData);
}

// 天気タイプから説明文を生成
function getWeatherDescription(weather: WeatherType): string {
  const descriptions: Record<WeatherType, string> = {
    sunny: '快晴',
    cloudy: '曇り',
    rainy: '雨',
    snowy: '雪',
    stormy: '雷雨',
  };
  return descriptions[weather];
}
