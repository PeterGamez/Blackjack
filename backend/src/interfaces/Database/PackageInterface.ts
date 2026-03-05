export interface PackageInterface {
    id: number;
    price: number; // ราคาเป็นบาท
    tokens: number; // จำนวน tokens ที่ได้
    name: string;
    description?: string;
    active: boolean;
}
