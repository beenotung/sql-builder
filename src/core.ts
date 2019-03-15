export interface SqlBuilder {
  toSqlString(): string;

  clone(): SqlBuilder;
}
