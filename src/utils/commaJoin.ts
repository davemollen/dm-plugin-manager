export function commaJoin(items: string[]){
    const lastItem = items.pop();
    return items.length ? `${items.join(', ')} & ${lastItem}` : lastItem;
}