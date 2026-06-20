/* eslint-disable @typescript-eslint/no-explicit-any */

import { type Result, ok, err } from "@dannywrayuk/results";

export type Pet = {
  name: string;
  is_cat?: boolean;
  address?: Person_Address;
};

export const validatePet = (
  obj?: Record<string, any>
): Result<Pet> => {
  if (typeof obj?.name !== "string") {
  return err(null, "validating name, expected string");
}
  if (typeof obj?.is_cat !== "boolean" && typeof obj?.is_cat !== "undefined") {
  return err(null, "validating is_cat, expected optional boolean");
}
  if (validatePerson_Address(obj?.address)[1] && typeof obj?.address !== "undefined") {
  return err(null, "validating address, expected optional Person_Address");
}
  
  return ok(obj as Pet);
};

export type Person_Address = {
  street?: string;
  city?: string;
  country?: string;
};

export const validatePerson_Address = (
  obj?: Record<string, any>
): Result<Person_Address> => {
  if (typeof obj?.street !== "string" && typeof obj?.street !== "undefined") {
  return err(null, "validating street, expected optional string");
}
  if (typeof obj?.city !== "string" && typeof obj?.city !== "undefined") {
  return err(null, "validating city, expected optional string");
}
  if (typeof obj?.country !== "string" && typeof obj?.country !== "undefined") {
  return err(null, "validating country, expected optional string");
}
  
  return ok(obj as Person_Address);
};

export type Person_Pet = {
  name?: string;
  is_cat?: boolean;
  is_fish?: boolean;
};

export const validatePerson_Pet = (
  obj?: Record<string, any>
): Result<Person_Pet> => {
  if (typeof obj?.name !== "string" && typeof obj?.name !== "undefined") {
  return err(null, "validating name, expected optional string");
}
  if (typeof obj?.is_cat !== "boolean" && typeof obj?.is_cat !== "undefined") {
  return err(null, "validating is_cat, expected optional boolean");
}
  if (typeof obj?.is_fish !== "boolean" && typeof obj?.is_fish !== "undefined") {
  return err(null, "validating is_fish, expected optional boolean");
}
  
  return ok(obj as Person_Pet);
};

export type Person = {
  name: string;
  age?: number;
  pets?: Person_Pet[];
  address?: Person_Address;
};

export const validatePerson = (
  obj?: Record<string, any>
): Result<Person> => {
  if (typeof obj?.name !== "string") {
  return err(null, "validating name, expected string");
}
  if (typeof obj?.age !== "number" && typeof obj?.age !== "undefined") {
  return err(null, "validating age, expected optional number");
}
  if ((!Array.isArray(obj?.pets) || obj?.pets?.some((i) => validatePerson_Pet(i)[1])) && typeof obj?.pets !== "undefined") {
  return err(null, "validating pets, expected optional Person_Pet[]");
}
  if (validatePerson_Address(obj?.address)[1] && typeof obj?.address !== "undefined") {
  return err(null, "validating address, expected optional Person_Address");
}
  
  return ok(obj as Person);
};

export type SayHello = (request: Person) => Promise<Result<Pet>>;