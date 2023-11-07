export class PropertyRequiredError extends Error {
  property: string;

  constructor(property: string) {
    super();
    this.name = "PropertyRequiredError";
    this.message = `Missing property: ${property}`;
    this.property = property;
  }
}
