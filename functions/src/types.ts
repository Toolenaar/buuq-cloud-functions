
export interface Customer {
    companyName: string;
    id: string;
    kvkNr: string;
    creationDate: any;
    type:string;
    uid: string;
    expenses: number;
    revenue: number;
}
export interface TransactionLine {
    amount: number;
    shortDescription: string;
    btwTarif: number;
    btwVerlegd: string;
}
export interface Transaction {
    amount: number;
    btwTarif: number;
    btwVerlegd: string;
    creationDate: any;
    customer: Customer;
    date: any;
    lines: TransactionLine[]
    nr: string;
    quarter: number;
    shortDescription: string;
    type: string;
    uid: string;
    year: number;
    total?: number;
    isDeleted: boolean;
}