export type HubAccount = {
  hub: string;
  instagram: string;
  region: string;
  city: string;
};

export const HUB_ACCOUNTS = [
  {
    hub: "Turkistan Hub",
    instagram: "turkistan.hub",
    region: "turkistan",
    city: "Туркестан",
  },
  {
    hub: "Batys Hub",
    instagram: "batys.hub",
    region: "west_kazakhstan",
    city: "Уральск",
  },
  {
    hub: "Astana Hub",
    instagram: "astana.hub",
    region: "astana",
    city: "Астана",
  },
  {
    hub: "Almaty Hub",
    instagram: "almaty_hub",
    region: "almaty",
    city: "Алматы",
  },
  {
    hub: "Zhambyl Hub",
    instagram: "zhambyl_hub",
    region: "zhambyl",
    city: "Тараз",
  },
  {
    hub: "Alatau Hub",
    instagram: "alatau.hub",
    region: "alatau",
    city: "Алатау",
  },
  {
    hub: "Atyrau Hub",
    instagram: "atyrau_it_hub",
    region: "atyrau",
    city: "Атырау",
  },
  {
    hub: "Shymkent Hub",
    instagram: "shymkent__hub",
    region: "shymkent",
    city: "Шымкент",
  },
  {
    hub: "Qostanai Hub",
    instagram: "qostanai.hub",
    region: "kostanay",
    city: "Костанай",
  },
  {
    hub: "Pavlodar Hub",
    instagram: "pavlodar.hub",
    region: "pavlodar",
    city: "Павлодар",
  },
  {
    hub: "Oskemen Hub",
    instagram: "oskemen.hub",
    region: "east_kazakhstan",
    city: "Оскемен",
  },
  {
    hub: "Aqtobe Hub",
    instagram: "aqtobe.hub",
    region: "aktobe",
    city: "Актобе",
  },
  {
    hub: "Aqmola Hub",
    instagram: "aqmola.hub",
    region: "aqmola",
    city: "Кокшетау",
  },
  {
    hub: "Mangystau Hub",
    instagram: "mangystau.hub",
    region: "mangystau",
    city: "Актау",
  },
  {
    hub: "Kyzylorda Hub",
    instagram: "kyzylordahub",
    region: "kyzylorda",
    city: "Кызылорда",
  },
  {
    hub: "Ulytau Hub",
    instagram: "ulytau.hub",
    region: "ulytau",
    city: "Жезказган",
  },
  {
    hub: "SKO Hub",
    instagram: "sko_hub",
    region: "north_kazakhstan",
    city: "Петропавловск",
  },
  {
    hub: "Jetisu Digital",
    instagram: "jetisu_digital",
    region: "jetisu",
    city: "Талдыкорган",
  },
  {
    hub: "Semey Hub",
    instagram: "semey.hub",
    region: "abai",
    city: "Семей",
  },
] as const satisfies readonly HubAccount[];
