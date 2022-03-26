export interface BarChartDataEntry {
  name: string;
  amount: number;
}

export interface BarChartConfig {
  width?: number;
  maxEntries?: number;
  order?: "ascending" | "descending";
}

function findLongestNameSize(data: BarChartDataEntry[]): number {
  let longestName = "";
  for (const entry of data) {
    if (entry.name.length > longestName.length) {
      longestName = entry.name;
    }
  }
  return longestName.length;
}

export function barChart(
  data: BarChartDataEntry[],
  config: BarChartConfig = {},
): void {
  if (data.length === 0) {
    return;
  }

  const width = config.width ?? 60;
  const char = "#";
  const maxEntries = config.maxEntries ?? 30;

  data = [...data];
  const longestNameSize = findLongestNameSize(data);
  const order = config.order ?? "descending";
  let minAmount = 0;
  let maxAmount = 0;
  if (order === "ascending") {
    data.sort((lhs, rhs) => lhs.amount - rhs.amount);
    minAmount = data[0]?.amount;
    maxAmount = data[data.length - 1]?.amount;
  } else {
    data.sort((lhs, rhs) => rhs.amount - lhs.amount);
    minAmount = data[data.length - 1]?.amount;
    maxAmount = data[0]?.amount;
  }

  const amountRange = maxAmount - minAmount;
  const scale = amountRange !== 0 ? width / amountRange : 1;
  const numberOfBars = (data.length < maxEntries ? data.length : maxEntries);

  for (let i = 0; i < numberOfBars; ++i) {
    const entry = data[i];
    let barHeight = Math.round((entry.amount - minAmount) * scale);
    if (barHeight <= 0) {
      barHeight = 1;
    } else if (barHeight >= width) {
      barHeight = width;
    }

    const padBarRight = width - barHeight;
    const padNameRight = longestNameSize - entry.name.length;

    console.log(
      entry.name + " ".repeat(padNameRight) + " |" + char.repeat(barHeight) +
        " ".repeat(padBarRight) + "| " +
        entry.amount.toString(),
    );
  }
}
