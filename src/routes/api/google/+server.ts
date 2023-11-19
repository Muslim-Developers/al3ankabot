import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSDOM } from 'jsdom';
import { GOOGLE_API_KEY, GPT_LINK } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
  const input = url.searchParams.get('q');
  if (input === null) throw error(400, 'Missing query parameter: q');

  try {
    const data = await scrapeGoogle(input);
    return askAnotherGPT4(input,data).then((firstResult) => {
      console.log(firstResult);
      return json({firstResult})
  }).catch((error) => {
      console.error('Error:', error);
  });
    // console.log(data)
    // return json(data);
  } catch (err) {
    console.error(err);
    throw error(500, 'Error Fetching Google: ' + (err as any).toString());
  }
};

const askAnotherGPT4=  async(q: string, sentncesOneLine: string)=> {
  const url = GPT_LINK;

  const headers = {
      'authority': GPT_LINK,
      'accept': '*/*',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,ar;q=0.7,ru;q=0.6',
      'content-type': 'application/json',
      'origin': 'https://docgpt.io',
      'referer': 'https://docgpt.io/',
      'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': 'macOS',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  };

  const systemMessage = `
      Your mission is to retrieve JSON with authentic verified data in Arabic, you will be provided with #Textual_information after the given word to get the information from it.
      Here is an exmaple for the output JSON:
        {
        "word": ${q},  الكلمة
        "meaning": "" معنى الكلمة
        "root": "",   الاصل او الجذر  
        "synonyms:""   مرادف الكلمة   
        "Trochee": "" التحليل الصرفي للكلمة    
        }

        All values in JSON should be in arabic. Only reply in JSON.
  `;


  const data = {
      "model": "gpt-4",
      "messages": [
          { "role": "system", "content": systemMessage },
          { "role": "user", "content": q + "\n#Textual_information:" + sentncesOneLine }
      ]
  };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      // Adjust the parsing of responseData according to the JSON structure
      return JSON.parse(responseData.choices[0].message.content);
  } catch (error) {
      console.error('Error:', error);
      return '';
  }
}

const handleSearch= async function handleSearch (title:string) {
  const apiKey = GOOGLE_API_KEY;
  const cx = '9229d27c17bfe4593'
  const rights = ''

  const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&rights=${rights}&q=${encodeURIComponent(
    title
  )}`
  console.log(url)
  try {
    const response = await fetch(url, {
      headers: {
        authority: 'customsearch.googleapis.com',
        accept: '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,ar;q=0.7',
        origin: 'https://thenextweb.com',
        referer: 'https://thenextweb.com/search',
        'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'x-client-data': 'CI62yQEIorbJAQipncoBCPX6ygEIk6HLAQj0mM0BCIagzQE='
      }
    })

    const data = await response.json()
    console.log(data )
    return data.items || []
  } catch (error) {
    console.error('Error fetching search results:', error)
  }
}

const scrapeGoogle = async (term: string) => {
  const wordInUrl = encodeURIComponent(term);
  const response = await fetch(`https://cse.google.com/cse/element/v1?rsz=filtered_cse&num=10&hl=en&source=gcsc&gss=.com&cselibv=2b35e7a15e0e30e2&cx=9229d27c17bfe4593&q=${wordInUrl}&safe=off&cse_tok=AB-tC_6n6jWykLRimasdW6ZATqZu%3A1700240257302&sort=&exp=csqr%2Ccc%2Cdtsq-3&oq=%D8%B1%D8%B9%D8%A7%D8%A8%D9%8A&gs_l=partner-web.12...0.0.13.62874.0.0.0.0.0.0.0.0..0.0.csems%2Cnrl%3D10...0.....34.partner-web..15.5.442.uHwPrGyfhjg&cseclient=hosted-page-client&callback=google.search.cse.api11343`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ar;q=0.7,ru;q=0.6",
      "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
      "sec-ch-ua-arch": "\"x86\"",
      "sec-ch-ua-bitness": "\"64\"",
      "sec-ch-ua-full-version": "\"116.0.5845.187\"",
      "sec-ch-ua-full-version-list": "\"Chromium\";v=\"116.0.5845.187\", \"Not)A;Brand\";v=\"24.0.0.0\", \"Google Chrome\";v=\"116.0.5845.187\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": "\"\"",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-ch-ua-platform-version": "\"10.14.4\"",
      "sec-ch-ua-wow64": "?0",
      "sec-fetch-dest": "script",
      "sec-fetch-mode": "no-cors",
      "sec-fetch-site": "same-origin",
      "x-client-data": "CI62yQEIorbJAQipncoBCObUygEI9frKAQiWocsBCPSYzQEIhqDNAQjcvc0BCLnKzQEIt8vNAQio2M0BCNTbzQEIpNzNAQjZ3M0BCOzdzQEIud7NAQi14M0BCPnA1BU=",
      "cookie": "HSID=AdT4tUr1naDrH5rK4; SSID=AJRqgy1OttFO0E9vo; APISID=KlXGxQzN4oWFwmhC/AWXZrF1GQW4SYHJ9O; SAPISID=x7_T8VreKw5jETuw/AzlRqcLgLTaHUn2ga; __Secure-1PAPISID=x7_T8VreKw5jETuw/AzlRqcLgLTaHUn2ga; __Secure-3PAPISID=x7_T8VreKw5jETuw/AzlRqcLgLTaHUn2ga; SID=cwigupOnR9ttKYIA3JumYuA_8vn5bR2DUE0ebs1MJ1pT8krr-xPFTRTrLFFjYOQ6jks2AA.; __Secure-1PSID=cwigupOnR9ttKYIA3JumYuA_8vn5bR2DUE0ebs1MJ1pT8krr826lAEM5vTk-agqc06eBEw.; __Secure-3PSID=cwigupOnR9ttKYIA3JumYuA_8vn5bR2DUE0ebs1MJ1pT8krrNTUkZFdV1qNKYDSyGFe-2w.; S=antipasti_server_prod=BR1hGiLE--eW-R7xqC1UIUaNs9UDKcrPq5miPaySL8o:billing-ui-v3=F2uxeT66aEsl8wCI0uzy71rFBxk5NJk7:billing-ui-v3-efe=F2uxeT66aEsl8wCI0uzy71rFBxk5NJk7; SEARCH_SAMESITE=CgQI25kB; __gsas=ID=8d7028e681590e89:T=1700132747:RT=1700132747:S=ALNI_MZBB5cvj76IY5l1ZvTrUIDIivkN0Q; AEC=Ackid1RDH8J_hUOcdTV4PZ17cF7C5nmr6ytt3ys4w_u7_aQ2SA0X2ZMNOA; 1P_JAR=2023-11-17-17; NID=511=DG5GfBaeOmnYfY4RZctC0sCUtg6ZWz-RZftFJQmvhhavbosAUyz0rmJAiZOVQmlqFKg_lXMC0nyjCsLCiJuoCnCWSwrF45L1D1Bo-R4YGXLYwhdvSGBcKcWfSzwpXC8wCbG46oOjK4QdjWsb6kS-u7Z4S2o8Fsp_S6Xv_58Pjp4VYuSx7orEUV1mWcNixFPC9iHZT8VS64G5TTchm7zXlYt6WrmWcVMmKOO3k7ez2f4YS1OLm2r7rEfTj1o58ju8a-M6WLnp1tfaHS3NjU2W0MDZtsjDiC8ychEh1m_IGvptgJB2c0Nh4QH6iyLaGgjdcYHDWmmJ76Dsi4YR6dnj_A2nLD4X8Tg7-M9IujHIOoZ1rkUeqQnc4k5j5TTk24XzGc_RJyumFTDt4_c7olQj6dA19kMHqHgodjXQhhBCs_HrVSE3hgUGwoDxrcqjf_aOJ8AiwifvHWFB2bTiRqBJLUQxJgYEbHAIOfmluKgkJMAChPRiVMRVm8o-wEvZwVXtQhKSwpovRufB_buglp1CEk5QV9pRI8_Ng6JWMzQeyu6TUxjN-i5W1jg_hzECMfspL41zHj8WbvEGXWLSpyLr3vuzySTJn646-byjgoL0ZW2UFrfy6r5XkxqztSgWc6gdiEgvR36CFnD3XR9q2KeSpFK8CkxLiclj_a2kUH1cay2Dnf7vqMuhu6kF1Ce-m-e_hFLmXIjfyB7R3j3UHrfIwtqi6uW45taer9NlLy2eMyg8ARmY2Leycsxpb0Z6Yi3gIdOOjxY7DIEdC58XPyUS2wZwT1cvomZZf5wRCwyp6Zy92OwSq8Efp1bsV7nXxlpCNcp9CrAYwfN7e4tQtOUerIpgwYjDM69Sti77aZo8Y9PabQJfRA; __Secure-1PSIDTS=sidts-CjIBNiGH7mnRABX_kZPj14_GSC_xsDl9OY2KWMuOLZoaxn6QYGYIYAFlBL9MZ4jYlqc8exAA; __Secure-3PSIDTS=sidts-CjIBNiGH7mnRABX_kZPj14_GSC_xsDl9OY2KWMuOLZoaxn6QYGYIYAFlBL9MZ4jYlqc8exAA; __Secure-ENID=16.SE=uH8KeN2xtOMokPmofxgba2rH7Tb0zeQBDoNaXOAqQ4AqxK4FrPLZD1G9hqxNfHTeHrcfE3jro6bKM7VYO1J4IyjOP6kCyB7csTVkqI_3BV7rI-eC_6s9wlDVjOJ7oNw7LFS8IRVRxnC4G36HPV7Eha0qAPgLgM1r7R5e8m1Ditt6Pj6MfVIhURFXiVsmteVrngPemawRCD5lVLmx0s2DeFcUbnmCxNoDv2pJ4w79QUeqozpg6SewDZFnrn1hsktQOVEqlK0Y8VEzdhYHe7NJWacs2_Wf1MB-5nWFbj-vF1C5Py_De535jdVAGUs60_evZQpyenjcXx1FjZlBXsBbyqeGAFd1oPw5ixhSDHT0pouVsjbcJapovX0r1AZQyVA_XkAOfhjIkDF0_-ddoEQz4DzZaIYmGu8aCYy9NAq9S9Ore9BHxVZzJ4O23jn8ATmm85rKPDllRLqCkuTj2Xwr7NbdbpHBI6lhjDjj; SIDCC=ACA-OxNW9z5HG39YmfxcoOIxKh97n-GeKZ1ONAXDA5av-sH2zDgqx8hMBEHyg1tFjXt15qBucsLm; __Secure-1PSIDCC=ACA-OxPwNmPWZPBpv3FXoWSVcBJev0PmBCzg0bOd6rnc_LnPtutFu_XQGKa_9PyFzOr3zitys9gE; __Secure-3PSIDCC=ACA-OxNJoLsULfl2nVne4BobUWezTiDS6VejAYY6DzSavHxkG1QZEuDp5cwxqHfP6Yr9qT7sGfc",
      "Referer": "https://cse.google.com/cse?cx=9229d27c17bfe4593",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  });
  const data = await response.text();
  if (!response.ok) throw new Error(data);
  // console.log(data)
  const results=JSON.parse(extractCleanJSON(data)).results
  const res=results?.map((el) => (el.contentNoFormatting ?? '').trim());
  // relatedSentences=askAnotherGPT4(term,res)
  console.log("res",res)
  const result = await scrapeArabiclexicon(term);
  console.log("result",result);
  if(!res){return result}
  return res
 
};

function extractCleanJSON(response: string): string {
  const yourString = response;

  // Find the index of the opening curly brace
  const startIndex = yourString.indexOf('{');
  
  const endIndex = yourString.lastIndexOf(')');

// Extract the JSON string content
const jsonString = yourString.substring(startIndex, endIndex);

// Remove the trailing semicolon if present
const cleanedJsonString = jsonString.replace(/;\s*$/, '');

// Parse the JSON string into an object
// const jsonObject = JSON.parse(cleanedJsonString);

  // console.log(cleanedJsonString)
  // const jsonObject = JSON.parse(cleanedJsonString);
  
  // // Access the "results" array
  // const resultsArray = jsonObject.results;
  return cleanedJsonString; // Trim any extra spaces
}
function replaceLetters(word1: string, word2: string, word3: string): string {
  // if (word2.length !== 3 || word3.length !== 3) {
  //     throw new Error("word2 and word3 should have three letters only.");
  // }

  const lettersToReplace: Record<string, string> = {};
  for (let i = 0; i < word2.length; i++) {
      lettersToReplace[word2[i]] = word3[i];
  }

  const replacedWord = word1.split('').map(letter => lettersToReplace[letter] || letter).join('');
  return replacedWord;
}

const scrapeArabiclexicon = async (term: string) => {
  let relatedWords: string[] = [];
  let relatedSentences: string[] = [];
  let firstResult;
  
  const wordInUrl = encodeURIComponent(term);

  const url = `http://arabiclexicon.hawramani.com/search/${wordInUrl}`;

  const response = await fetch(url);

  const data = await response.text();
  if (!response.ok) throw new Error(data);
  console.log(url)
  const { window } = new JSDOM(data);
  const { document: dom } = window;
  const olTags= [...dom.querySelectorAll('div.search-item-container')];


  if (olTags) {
    relatedSentences=olTags.map((el) => (el.textContent ?? '').trim());
  }
  return {
    relatedSentences
  };
};

const scrapeMaajim = async (term: string) => {
  let relatedWords: string[] = [];
  let relatedSentences: string[] = [];
  const wordInUrl = encodeURIComponent(term);

  const url = `https://www.maajim.com/dictionary/${wordInUrl}/`;

  const response = await fetch(url);

  const data = await response.text();
  console.log(data)
  if (!response.ok) throw new Error(data);

  const { window } = new JSDOM(data);
  const { document: dom } = window;
  // const ulTag = dom.querySelector('div.panel-body.text-center ul.list-inline');

  // if (ulTag) {
  //   const liElements = [...ulTag.querySelectorAll('li')];
  //   relatedWords = liElements.map((el) => (el.textContent ?? '').trim());
  // }

  const olTags = [...dom.querySelectorAll('section div.parag div.result div.collapse')];
  relatedSentences = olTags.map((el) => (el.textContent ?? '').trim());
  // if (olTags) {
  //   relatedSentences = olTags.flatMap((olTag) => {
  //     const liElements = [...olTag.querySelectorAll('li')];
  //     const sentences = liElements.map((el) => (el.textContent ?? '').trim());
  //     return sentences;
  //   });
  // }
  return {
    relatedWords,
    relatedSentences,
  };
};
// Example usage:
// const word1 = "رعابيب";
// const word2 = "رَعبَبَ";
// const word3 = "فعلل";

