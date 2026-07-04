export default class QuestItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      rarity: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.StringField({ required: false, blank: true, initial: "" }),
      hasRoll: new fields.BooleanField({ required: true, initial: false }),
      rollTiers: new fields.ArrayField(
        new fields.SchemaField({
          min: new fields.NumberField({ required: true, integer: true, initial: 1 }),
          max: new fields.NumberField({ required: true, integer: true, initial: 1 }),
          text: new fields.StringField({ blank: true, initial: "" })
        }),
        { initial: [] }
      )
    };
  }
}