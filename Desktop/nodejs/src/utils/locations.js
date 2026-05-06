export const UZBEKISTAN_LOCATIONS = Object.freeze({
  andijan: {
    uz: 'Andijon',
    ru: 'Андижанская область',
    en: 'Andijan region',
    districts: {
      andijan_city: { uz: 'Andijon shahri', ru: 'город Андижан', en: 'Andijan city' },
      asaka: { uz: 'Asaka', ru: 'Асакинский', en: 'Asaka' },
      baliqchi: { uz: 'Baliqchi', ru: 'Балыкчинский', en: 'Baliqchi' },
      marhamat: { uz: 'Marhamat', ru: 'Мархаматский', en: 'Marhamat' },
      paxtaobod: { uz: 'Paxtaobod', ru: 'Пахтаабадский', en: 'Pakhtaabad' },
      xonobod: { uz: 'Xonobod shahri', ru: 'город Ханабад', en: 'Khanabad city' }
    }
  },
  bukhara: {
    uz: 'Buxoro',
    ru: 'Бухарская область',
    en: 'Bukhara region',
    districts: {
      bukhara_city: { uz: 'Buxoro shahri', ru: 'город Бухара', en: 'Bukhara city' },
      gijduvon: { uz: 'G‘ijduvon', ru: 'Гиждуванский', en: 'Gijduvan' },
      jondor: { uz: 'Jondor', ru: 'Жондорский', en: 'Jondor' },
      qorako_l: { uz: 'Qorako‘l', ru: 'Каракульский', en: 'Karakul' },
      romitan: { uz: 'Romitan', ru: 'Ромитанский', en: 'Romitan' },
      vabkent: { uz: 'Vobkent', ru: 'Вабкентский', en: 'Vabkent' }
    }
  },
  fergana: {
    uz: "Farg'ona",
    ru: 'Ферганская область',
    en: 'Fergana region',
    districts: {
      fergana_city: { uz: 'Farg‘ona shahri', ru: 'город Фергана', en: 'Fergana city' },
      kokand: { uz: 'Qo‘qon shahri', ru: 'город Коканд', en: 'Kokand city' },
      margilon: { uz: 'Marg‘ilon shahri', ru: 'город Маргилан', en: 'Margilan city' },
      quva: { uz: 'Quva', ru: 'Кувинский', en: 'Quva' },
      rishton: { uz: 'Rishton', ru: 'Риштанский', en: 'Rishtan' },
      oltiariq: { uz: 'Oltiariq', ru: 'Алтыарыкский', en: 'Oltiariq' }
    }
  },
  namangan: {
    uz: 'Namangan',
    ru: 'Наманганская область',
    en: 'Namangan region',
    districts: {
      namangan_city: { uz: 'Namangan shahri', ru: 'город Наманган', en: 'Namangan city' },
      chortoq: { uz: 'Chortoq', ru: 'Чартакский', en: 'Chartak' },
      chust: { uz: 'Chust', ru: 'Чустский', en: 'Chust' },
      kosonsoy: { uz: 'Kosonsoy', ru: 'Касансайский', en: 'Kasansay' },
      pop: { uz: 'Pop', ru: 'Папский', en: 'Pap' },
      uychi: { uz: 'Uychi', ru: 'Уйчинский', en: 'Uychi' }
    }
  },
  samarkand: {
    uz: 'Samarqand',
    ru: 'Самаркандская область',
    en: 'Samarkand region',
    districts: {
      samarkand_city: { uz: 'Samarqand shahri', ru: 'город Самарканд', en: 'Samarkand city' },
      urgut: { uz: 'Urgut', ru: 'Ургутский', en: 'Urgut' },
      ishtixon: { uz: 'Ishtixon', ru: 'Иштыханский', en: 'Ishtikhan' },
      pastdargom: { uz: 'Pastdarg‘om', ru: 'Пастдаргомский', en: 'Pastdargom' },
      payariq: { uz: 'Payariq', ru: 'Пайарыкский', en: 'Payariq' },
      kattakurgan: { uz: 'Kattaqo‘rg‘on', ru: 'Каттакурганский', en: 'Kattakurgan' }
    }
  },
  tashkent_region: {
    uz: 'Toshkent vil.',
    ru: 'Ташкентская область',
    en: 'Tashkent region',
    districts: {
      bekobod: { uz: 'Bekobod', ru: 'Бекабадский', en: 'Bekabad' },
      bo_ka: { uz: 'Bo‘ka', ru: 'Букаинский', en: 'Buka' },
      chortoq_tash: { uz: 'Chortoq', ru: 'Чирчикский', en: 'Chirchiq district' },
      ohangaron: { uz: 'Ohangaron', ru: 'Ахангаранский', en: 'Ahangaran' },
      parkent: { uz: 'Parkent', ru: 'Паркентский', en: 'Parkent' },
      yangiyol: { uz: 'Yangiyo‘l', ru: 'Янгиюльский', en: 'Yangiyul' }
    }
  },
  tashkent_city: {
    uz: 'Toshkent sh.',
    ru: 'город Ташкент',
    en: 'Tashkent city',
    districts: {
      bektemir: { uz: 'Bektemir', ru: 'Бектемирский', en: 'Bektemir' },
      chilonzor: { uz: 'Chilonzor', ru: 'Чиланзарский', en: 'Chilanzar' },
      mirzo_ulugbek: { uz: 'Mirzo Ulug‘bek', ru: 'Мирзо-Улугбекский', en: 'Mirzo-Ulugbek' },
      sergeli: { uz: 'Sergeli', ru: 'Сергелийский', en: 'Sergeli' },
      shayxontohur: { uz: 'Shayxontohur', ru: 'Шайхантахурский', en: 'Shaykhantakhur' },
      yunusobod: { uz: 'Yunusobod', ru: 'Юнусабадский', en: 'Yunusabad' }
    }
  }
});

/** @param {'uz'|'ru'|'en'} lang */
export function getRegionOptions(lang) {
  return Object.entries(UZBEKISTAN_LOCATIONS).map(([key, value]) => ({
    key,
    label: value[lang] ?? value.uz
  }));
}

/** @param {'uz'|'ru'|'en'} lang */
export function getDistrictOptions(regionKey, lang) {
  const region = UZBEKISTAN_LOCATIONS[regionKey];
  if (!region) return [];
  return Object.entries(region.districts).map(([key, value]) => ({
    key,
    label: value[lang] ?? value.uz
  }));
}

/** @param {'uz'|'ru'|'en'} lang */
export function resolveRegionByLabel(input, lang) {
  const trimmed = String(input).trim();
  for (const [key, value] of Object.entries(UZBEKISTAN_LOCATIONS)) {
    const localized = value[lang] ?? value.uz;
    if (trimmed === localized) return { key, label: localized };
  }
  return null;
}

/** @param {'uz'|'ru'|'en'} lang */
export function resolveDistrictByLabel(regionKey, input, lang) {
  const trimmed = String(input).trim();
  const districts = getDistrictOptions(regionKey, lang);
  for (const district of districts) {
    if (trimmed === district.label) return district;
  }
  return null;
}
