/**
 * answers 是按题号排序的选项下标数组，例如 [0, 2, 1, ...]。
 * 计分只依赖题库和答案；同一份答案始终返回同一结果。
 */
export function scoreQuiz(data, answers) {
  if (!Array.isArray(answers) || answers.length !== data.questions.length) {
    throw new Error(`需要回答全部 ${data.questions.length} 道题`);
  }

  const totals = Object.fromEntries(data.dimensions.map(d => [d.id, { sum: 0, count: 0 }]));
  data.questions.forEach((question, index) => {
    const answer = answers[index];
    if (!Number.isInteger(answer) || answer < 0 || answer >= question.options.length) {
      throw new Error(`第 ${index + 1} 题的答案无效`);
    }
    const dimension = totals[question.dimension];
    if (!dimension) throw new Error(`未知维度：${question.dimension}`);
    dimension.sum += question.options[answer].value;
    dimension.count += 1;
  });

  const dimensions = Object.fromEntries(Object.entries(totals).map(([id, { sum, count }]) => [
    id,
    Math.round((sum / count + 1) * 50)
  ]));
  const vector = data.dimensions.map(d => dimensions[d.id]);
  const ranked = data.results.map(result => ({
    result,
    distance: vector.reduce((sum, value, index) => sum + (value - result.prototype[index]) ** 2, 0)
  })).sort((a, b) => a.distance - b.distance || a.result.id.localeCompare(b.result.id));

  return { dimensions, result: ranked[0].result, vector };
}

/** 把 24 个三选一答案压成短字符串，可放进分享链接。 */
export function encodeAnswers(answers) {
  if (!Array.isArray(answers) || answers.some(v => !Number.isInteger(v) || v < 0 || v > 2)) {
    throw new Error('答案必须是 0、1、2 组成的数组');
  }
  return answers.reduce((n, v) => n * 3n + BigInt(v), 0n).toString(36);
}

export function decodeAnswers(code, count = 24) {
  if (!/^[0-9a-z]+$/i.test(code)) throw new Error('分享码无效');
  let n = 0n;
  for (const digit of code.toLowerCase()) {
    n = n * 36n + BigInt(parseInt(digit, 36));
  }
  const answers = Array(count).fill(0);
  for (let i = count - 1; i >= 0; i--) {
    answers[i] = Number(n % 3n);
    n /= 3n;
  }
  if (n !== 0n) throw new Error('分享码长度无效');
  return answers;
}
