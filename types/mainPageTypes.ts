import { string } from "zod";

export interface HomeDelivery {
    shopName: string,
    shopLogoName: string
}

export interface LanguageSwitcher {
    language: string,
    loginBtnText: string
}