import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';

dotenv.config();

const VALID_STANDARD_UNITS = [
  'kg',
  'g',
  'lít',
  'ml',
  'cái',
  'gói',
  'hộp',
  'lon',
];

const TARGET_UNIT_CONFIG = {
  kg: {
    normalizedUnit: 'kg',
    standardUnit: 'g',
    standardUnitFactor: 1000,
  },
  g: {
    normalizedUnit: 'g',
    standardUnit: 'g',
    standardUnitFactor: 1,
  },
  lít: {
    normalizedUnit: 'lít',
    standardUnit: 'ml',
    standardUnitFactor: 1000,
  },
  lit: {
    normalizedUnit: 'lít',
    standardUnit: 'ml',
    standardUnitFactor: 1000,
  },
  ml: {
    normalizedUnit: 'ml',
    standardUnit: 'ml',
    standardUnitFactor: 1,
  },
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const isNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

const isMissingValue = (value) =>
  value === undefined || value === null || value === '';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const estimateCostPriceByIngredient = (ingredient) => {
  const unit = ingredient.unit;
  const normalizedName = normalizeText(ingredient.name);

  const basePriceHints = [
    { pattern: /(thit bo|bo my|bo uc)/, unit: 'kg', price: 280000 },
    { pattern: /(thit heo|heo)/, unit: 'kg', price: 120000 },
    { pattern: /(thit ga|ga ta|ga cong nghiep)/, unit: 'kg', price: 90000 },
    { pattern: /(gao)/, unit: 'kg', price: 22000 },
    { pattern: /(ca chua)/, unit: 'kg', price: 30000 },
    { pattern: /(rau xa lach|xa lach)/, unit: 'kg', price: 35000 },
    { pattern: /(hanh la|hanh)/, unit: 'kg', price: 50000 },
    {
      pattern: /(bun tuoi|pho kho|mi soi|bun|pho|mi)/,
      unit: 'kg',
      price: 40000,
    },
    { pattern: /(duong)/, unit: 'kg', price: 22000 },
    { pattern: /(muoi)/, unit: 'kg', price: 15000 },
    { pattern: /(dau an)/, unit: 'lít', price: 50000 },
    { pattern: /(nuoc mam|nước mắm)/, unit: 'lít', price: 60000 },
    { pattern: /(trung ga|trứng gà)/, unit: 'cái', price: 3500 },
  ];

  const matchedHint = basePriceHints.find((hint) =>
    hint.pattern.test(normalizedName)
  );

  const convertHintPriceToUnit = (hint) => {
    if (!hint) {
      return null;
    }

    if (hint.unit === unit) {
      return hint.price;
    }

    if (hint.unit === 'kg' && unit === 'g') {
      return hint.price / 1000;
    }

    if (hint.unit === 'g' && unit === 'kg') {
      return hint.price * 1000;
    }

    if (hint.unit === 'lít' && unit === 'ml') {
      return hint.price / 1000;
    }

    if (hint.unit === 'ml' && unit === 'lít') {
      return hint.price * 1000;
    }

    return null;
  };

  const priceFromHint = convertHintPriceToUnit(matchedHint);
  if (isPositiveNumber(priceFromHint)) {
    return priceFromHint;
  }

  const unitFallbackPrices = {
    kg: 50000,
    g: 50,
    lít: 30000,
    ml: 30,
    cái: 5000,
    gói: 12000,
    hộp: 20000,
    lon: 15000,
  };

  return unitFallbackPrices[unit] || 5000;
};

const buildBackfillUpdate = (ingredient) => {
  const currentUnit = ingredient.unit;
  const unitConfig = TARGET_UNIT_CONFIG[currentUnit];

  const currentStandardUnit = ingredient.standardUnit;
  const resolvedDefaultStandardUnit = unitConfig
    ? unitConfig.standardUnit
    : VALID_STANDARD_UNITS.includes(currentUnit)
      ? currentUnit
      : 'cái';

  const defaultStandardUnit = unitConfig
    ? unitConfig.standardUnit
    : isMissingValue(currentStandardUnit)
      ? resolvedDefaultStandardUnit
      : currentStandardUnit;
  const defaultStandardUnitFactor = unitConfig
    ? unitConfig.standardUnitFactor
    : 1;

  const setData = {};

  const currentCostPrice = toSafeNumber(ingredient.costPrice, 0);
  const shouldFillCostPrice =
    isMissingValue(ingredient.costPrice) || currentCostPrice <= 0;

  if (shouldFillCostPrice) {
    setData.costPrice = estimateCostPriceByIngredient(ingredient);
  }

  if (isMissingValue(ingredient.standardUnit)) {
    setData.standardUnit = defaultStandardUnit;
  }

  if (isMissingValue(ingredient.standardUnitFactor)) {
    setData.standardUnitFactor = defaultStandardUnitFactor;
  }

  const resolvedCostPrice = shouldFillCostPrice
    ? toSafeNumber(setData.costPrice, 0)
    : currentCostPrice;

  const resolvedStandardUnitFactor = isMissingValue(
    ingredient.standardUnitFactor
  )
    ? defaultStandardUnitFactor
    : isPositiveNumber(ingredient.standardUnitFactor)
      ? Number(ingredient.standardUnitFactor)
      : defaultStandardUnitFactor;

  const currentCostPerStandardUnit = toSafeNumber(
    ingredient.costPerStandardUnit,
    0
  );
  const shouldFillCostPerStandardUnit =
    isMissingValue(ingredient.costPerStandardUnit) ||
    currentCostPerStandardUnit <= 0;

  if (shouldFillCostPerStandardUnit) {
    setData.costPerStandardUnit =
      resolvedCostPrice > 0
        ? resolvedCostPrice / resolvedStandardUnitFactor
        : 0;
  }

  return setData;
};

const run = async () => {
  const isDryRun = process.argv.includes('--dry-run');

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Thiếu MONGODB_URI trong môi trường');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công');

    const ingredients = await Ingredient.find({}, [
      '_id',
      'name',
      'unit',
      'standardUnit',
      'standardUnitFactor',
      'costPrice',
      'costPerStandardUnit',
    ]).lean();

    if (!ingredients.length) {
      console.log('ℹ️ Không có dữ liệu nguyên liệu để backfill');
      process.exit(0);
    }

    const operations = [];
    let targetUnitUpdatedCount = 0;

    for (const ingredient of ingredients) {
      const updateData = buildBackfillUpdate(ingredient);
      const updateKeys = Object.keys(updateData);

      if (!updateKeys.length) {
        continue;
      }

      if (['kg', 'g', 'lít', 'lit', 'ml'].includes(ingredient.unit)) {
        targetUnitUpdatedCount += 1;
      }

      operations.push({
        updateOne: {
          filter: { _id: ingredient._id },
          update: { $set: updateData },
        },
      });
    }

    console.log(`📦 Tổng nguyên liệu: ${ingredients.length}`);
    console.log(`🔧 Số bản ghi cần cập nhật: ${operations.length}`);
    console.log(`🧪 Chế độ: ${isDryRun ? 'DRY RUN' : 'UPDATE'}`);

    if (!operations.length) {
      console.log('✅ Dữ liệu đã đầy đủ, không cần backfill');
      process.exit(0);
    }

    if (isDryRun) {
      console.log('✅ Dry run hoàn tất, chưa ghi dữ liệu');
      console.log(
        `ℹ️ Số bản ghi nhóm đơn vị kg/g/lít/ml được điền field mới: ${targetUnitUpdatedCount}`
      );
      process.exit(0);
    }

    const result = await Ingredient.bulkWrite(operations, { ordered: false });

    console.log(`✅ Backfill hoàn tất, modified: ${result.modifiedCount || 0}`);
    console.log(
      `ℹ️ Số bản ghi nhóm đơn vị kg/g/lít/ml được điền field mới: ${targetUnitUpdatedCount}`
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi backfill nguyên liệu:', error?.message || error);
    process.exit(1);
  }
};

run();
