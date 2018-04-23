export class Promises {
    getPromise(url, params) {
        // для проформы
        let request = {
            url: url,
            type: "GET",
            params: {}
        };

        if (params) request.params = params;

        return $.get(request);
    }
}