module.exports = (fn) => { //recibe una funcion y devuelve la ejecucion de esa funcion + un catch si es que la ejecucion lanza un error
    return (req, res, next) => {
        return fn(req, res, next).catch(next) //catch(err=>next(err)) == catch(next)
    }
}