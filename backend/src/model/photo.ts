export const PHOTO_REGEX = new RegExp(
  "^(?<year>[\\d]{4})\\/(?<month>[\\d]{1,2})\\/(?<day>[\\d]{1,2})\\/(?<filename>.*.(jpg|png))$",
  "i"
);

export class Photo {
  private year: number;
  private month: number;
  private day: number;
  private filename: any;
  private relativePath: any;

  static get PATH_PATTERN() {
    return PHOTO_REGEX;
  }

  constructor(relativePath) {
    const match = Photo.PATH_PATTERN.exec(relativePath);

    if (!match) {
      throw new Error(`Photo file path does not match expected pattern`);
    }

    this.year = parseInt(match.groups.year);
    this.month = parseInt(match.groups.month);
    this.day = parseInt(match.groups.day);
    this.filename = match.groups.filename;

    this.relativePath = relativePath;
  }
}
