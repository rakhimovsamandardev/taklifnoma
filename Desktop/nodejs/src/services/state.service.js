import listingStates from '../states/listingStates.js';

export function initialListingDraft() {
  return {
    tenant_type: null,
    photos: [],
    rooms: null,
    type: null,
    address: {
      region: null,
      district: null,
      manual_address: null
    },
    area: null,
    total_floors: null,
    current_floor: null,
    condition: null,
    price: null,
    price_currency: null,
    phone: null
  };
}

export class StateService {
  constructor(userRepository) {
    this.users = userRepository;
  }

  async getUserRecord(userId) {
    const row = await this.users.findById(userId);
    if (!row) {
      return {
        id: userId,
        language: 'uz',
        state: listingStates.IDLE,
        stateDataRaw: '{}',
        stateData: {}
      };
    }
    let stateData = {};
    try {
      stateData = JSON.parse(row?.stateDataRaw ?? '{}') || {};
    } catch {
      stateData = {};
    }
    return {
      ...row,
      stateData
    };
  }

  async setIdle(userId) {
    await this.users.setState(userId, listingStates.IDLE, {});
  }

  async startAddHouse(userId) {
    await this.users.setState(userId, listingStates.ADD_HOUSE_TENANT_TYPE, initialListingDraft());
  }

  async setStateBundle(userId, state, stateData) {
    await this.users.setState(userId, state, stateData);
  }

  async advance(userId, nextState, partial) {
    const row = await this.users.findById(userId);
    let parsed = {};
    try {
      parsed = JSON.parse(row?.stateDataRaw ?? '{}') || {};
    } catch {
      parsed = {};
    }
    const base = { ...initialListingDraft(), ...parsed };
    const next = { ...base, ...partial };
    await this.users.setState(userId, nextState, next);
    return next;
  }
}
