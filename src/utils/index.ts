export function isInstanceOf(Constructor, instance: any): boolean {
  if (!instance) {
    return false;
  }
  return (
    instance instanceof Constructor || instance.prototype instanceof Constructor
  );
}

export function compareClasses(ChildType, PotentialParentType): boolean {
  return (
    ChildType === PotentialParentType ||
    ChildType.prototype instanceof PotentialParentType ||
    ChildType.name === PotentialParentType.name
  );
}
