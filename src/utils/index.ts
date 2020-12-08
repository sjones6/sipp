export function compareClasses(ChildType, PotentialParentType): boolean {
  return (
    ChildType === PotentialParentType ||
    ChildType.prototype instanceof PotentialParentType ||
    ChildType.name === PotentialParentType.name
  );
}
