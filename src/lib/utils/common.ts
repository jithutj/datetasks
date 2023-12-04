import type { TODO } from "$lib/types";
import _ from "lodash";

export const getRandomNumberString = (length: number): number => {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return Number(result);
}

export const groupByKey = (data: any) => {
  const groupedByDate = _.groupBy(data, 'key');

  // Convert the grouped object into an array of objects with the desired structure
  const newArray = Object.keys(groupedByDate).map(key => ({
    //@ts-ignore
    [key]: groupedByDate[key].map(item => item.doc)
  }));

  return newArray;
}

export function indexResultGroupByDate(data: Record<string, string>[]) {
  const groupedByDate = _.groupBy(data, 'date');
  const newArray = _.map(groupedByDate, (docs, date) => ({ [date]: docs }));
  return newArray;
} 

export const mergeNewObject = (currentArr: TODO[], newObj: TODO) => {
  const index = _.findIndex(currentArr, { '_id': newObj._id });
    if (index !== -1) {
    _.merge(currentArr[index], newObj);
    } else {
    currentArr.push(newObj);
    }

    return currentArr;
}

export const removeObject = (currentArr: TODO[], removeId: string) => {
  _.remove(currentArr, { '_id': removeId });
  return currentArr;
}

export const removeBatchObject = (currentArr: TODO[], removeIds: [string]) => {
  removeIds.forEach(objectIdToRemove => {
    _.remove(currentArr, { '_id': objectIdToRemove });
  });
  return currentArr;
}