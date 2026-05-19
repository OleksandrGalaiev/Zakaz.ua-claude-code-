import { string } from "zod";

export interface HomeDelivery {
    shopName: string,
    shopMarker: string,
    shopLogoName: string
}

export interface LanguageSwitcher {
    language: string,
    loginBtnText: string
}