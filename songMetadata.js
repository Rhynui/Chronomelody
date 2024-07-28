/**
 * Author      : Isaac Zhou
 * Course Code : ICS2O1-05
 * Date Created: Jun 07, 2022
 * Last Updated: Oct 23, 2022
 * Description : A file for storing all metadata of the included songs
 */

/**
 * Metadata:
 * folder - the name of the folder of which the audio and cover of the song are stored
 * title - the title of the song
 * artist - the artist of the song
 * mapper - the mapper of the song's chart
 * bpm - the BPM of the song
 * difficulty - the difficulty of the song
 * chart - the constant name of the song's chart
 * previewTime - the time in milisecond of when the song is played in the song select screen
 */

// create a structure to store all kinds of metadata
function song(a, b, c, d, e, f, g, h) {
  this.folder = a;
  this.title = b;
  this.artist = c;
  this.mapper = d;
  this.bpm = e;
  this.difficulty = f;
  this.chart = g;
  this.previewTime = h;
  this.audio; // initialize for later use
  this.image; // initialize for later use
}

// manually sorted from least to most difficult
const SONGS = [
  new song("toby fox - Uwa!! So Holiday","Uwa!! So Holiday♫","toby fox","GGraterson","70",3,UWA_SO_HOLIDAY,15),
  new song("Nanahira - Shuwa_Shuwa Parfait","Shuwa*Shuwa Parfait","ななひら","PianoLuigi","155",3,SHUWA_SHUWA_PARFAIT,56864),
  new song("UNDEAD CORPORATION - Without the end","Without the end","UNDEAD CORPORATION","Maxim-Miau","105",4,WITHOUT_THE_END,28708),
  new song("S-C-U feat Qrispy Joybox - anemone","anemone","S-C-U feat. Qrispy Joybox","Julie","200",4,ANEMONE,68730),
  new song("litmus_ - Rush-More","Rush-More","litmus*","FAMoss","160",4,RUSH_MORE,23575),
  new song("ginkiha - nightfall","nightfall","ginkiha","Hotaru-","92",5,NIGHTFALL,41749),
  new song("sakuzyo - Altale","Altale","削除","Kuo Kyoka","83-90 (90)",5,ALTALE,95065),
  new song("bill wurtz - the high class stuff","the high class stuff","bill wurtz","Weber","60-220 (127)",5,THE_HIGH_CLASS_STUFF,1799),
  new song("ARForest - Colors (Cut Ver)","Colors (Cut Ver.)","ARForest","Scotty","180",6,COLORS_CUT_VER,5546),
  new song("ARForest - Final Resonance","Final Resonance","ARForest","[ A v a l o n ]","195",7,FINAL_RESONANCE,99364),
  new song("SawanoHiroyuki[nZk]_mizuki - &Z (TV Size)","&Z (TV Size)","SawanoHiroyuki[nZk]:mizuki","[Shana Lesus]","158",7,_Z_TV_SIZE,62974),
  new song("YOASOBI - Haruka","ハルカ","YOASOBI","Faputa","100",7,HARUKA,72747),
  new song("ginkiha - EOS","EOS","ginkiha","[ A v a l o n ]","175",7,EOS,54949),
  new song("Lime - 8bit Voyager","8bit Voyager","Lime","Eclipse-","182",8,_8BIT_VOYAGER,22396),
  new song("Shiggy Jr - oyasumi (Cut Ver)","oyasumi (Cut Ver.)","Shiggy Jr.","Pairoxd","200",9,OYASUMI,19638),
  new song("Yoisaki Kanade - Hitorinbo Envy","独りんぼエンヴィー","宵崎奏","Drum-Hitnormal","132",9,HITORINBO_ENVY,47436),
  new song("Jay Chou - Won't Cry","說好不哭","周杰倫 with 五月天阿信","Madoka2574","40-76 (76)",9,WONT_CRY,75449),
  new song("Morimori Atsushi - PUPA","PUPA","モリモリあつし","Valentrixe","202",10,PUPA,78383),
  new song("Porter Robinson & Madeon - Shelter","Shelter","Porter Robinson & Madeon","Dellvangel","100",11,SHELTER,19527),
  new song("Ogura Yui - Clear Morning","Clear Morning","小倉唯","Rosemi","103",11,CLEAR_MORNING,55426),
  new song("Martin Garrix - Animals","Animals","Martin Garrix","DrawdeX","128",11,ANIMALS,83630),
  new song("Nishino Kana - Sweet Dreams (11t dnb mix)","Sweet Dreams (11t dnb mix)","西野カナ","-MysticEyes","175",13,SWEET_DREAMS_11T_DNB_MIX,54981),
  new song("Mittsies - Vitality (t+pazolite Remix)","Vitality (t+pazolite Remix)","Mittsies","Lirai","175",14,VITALITY_T_PAZOLITE_REMIX,65921),
  new song("DJKurara - Japanese Transformation","Japanese Transformation","DJKurara","XeoStyle","260",15,JAPANESE_TRANSFORMATION,77082),
  new song("aran & Kobaryo - Hageshi Konoyoru -Psylent Crazy Night-","はげしこの夜 -Psylent Crazy Night-","aran & Kobaryo","Fawcro32","100-300 (150)",15,HAGESHI_KONOYORU_PSYLENT_CRAZY_NIGHT,77082),
  new song("Camellia feat Nanahira - POLKAMANIA","POLꞰAMAИIA","かめりあ feat. ななひら","Al-Reina","160",15,POLKAMANIA,52157),
  new song("Pastel_Palettes - Tenka Toitsu A to Z_","天下卜ーイツ A to Z☆","Pastel＊Palettes","Al-Reina","153",16,TENKA_TOITSU_A_TO_Z,47497),
  new song("Hanatan - Jishou Mushoku","自傷無色","花たん","Abraxos","120",19,JISHOU_MUSHOKU,56776),
  new song("Wonderlands x Showtime x KAITO - TONDEMO-WONDERZ","トンデモワンダーズ","ワンダーランズ×ショウタイム × KAITO","chocomilku-","70-270 (172)",20,TONDEMO_WONDERZ,31148),
  new song("P_Light - SAtAN","SAtAN","P*Light","FAMoss","300",20,SATAN,31148),
  new song("Frums - VIS__CRACKED","VIS::CRACKED","Frums","HowToPlayLN","242",22,VIS__CRACKED,107090),
  new song("Kairiki Bear - Shippaisaku Shoujo [inabakumori Remix]","失敗作少女 [稲葉曇 Remix]","かいりきベア","Ballistic","136",22,SHIPPAISAKU_SHOUJO_INABAKUMORI_REMIX,45202),
  new song("Mage - The Words I Never Said in D&B","The Words I Never Said in D&B","Mage","Jole","172",23,THE_WORDS_I_NEVER_SAID_IN_D_B,65668),
  new song("GYARI - Akari ga Yatte Kita Zo (Cut Ver)","アカリがやってきたぞっ (Cut Ver.)","GYARI","LeiN-","136",27,AKARI_GA_YATTE_KITA_ZO_CUT_VER,22908),
  new song("t+pazolite feat Rizna - Unlimited Spark! (remake)","Unlimited Spark! (remake)","t+pazolite feat. リズナ","_underjoy","185",32,UNLIMITED_SPARK_REMAKE,319134),
];