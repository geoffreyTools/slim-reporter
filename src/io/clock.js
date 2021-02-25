export default (event, delta) => {
    const timer = setInterval(event, delta);
    return { stop: () => clearInterval(timer) }
}