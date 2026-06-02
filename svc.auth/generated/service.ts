export type Pet = {
  	name: string;
		is_cat?: boolean;
};

export type Person = {
  	name: string;
		age?: number;
		pets?: Person_Pet[];
		address?: Person_Address;
};