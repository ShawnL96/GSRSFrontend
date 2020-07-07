import { HttpParams } from '@angular/common/http';
import { FacetParam } from '@gsrs-core/facets-manager';

export class FacetHttpParams extends HttpParams {

    constructor(options?: any) {
        super(options);
    }

    appendFacetParams(facets: FacetParam): FacetHttpParams {
        let clone = new FacetHttpParams({ fromString: super.toString() });
        let hasDeprecated = false;
        if (facets != null) {
            const facetsKeys = Object.keys(facets);
            facetsKeys.forEach(facetKey => {
                if (facets[facetKey] != null) {
                    const facetValueKeys = Object.keys(facets[facetKey].params);
                    facetValueKeys.forEach((facetValueKey) => {
                        if (facets[facetKey].params[facetValueKey] != null) {
                            if (facetValueKey === 'Deprecated') {
                                hasDeprecated = true;
                            }

                            const paramPrefix = !facets[facetKey].params[facetValueKey] ? '!' :
                                facets[facetKey].isAllMatch ? '^' : '';

                            clone = clone.append(
                                'facet',
                                (`${paramPrefix}${facetKey.replace(/\//g, '$$$')}/${facetValueKey.replace(/\//g, '$$$')}`));
                        }
                    });
                }
            });
        }
        if ( !hasDeprecated) {
            clone = clone.append('facet', '!Deprecated/Deprecated');
        }
        return clone;
    }

    append(param: string, value: string): FacetHttpParams {
        const httpParamsClone = super.append(param, value);
        const clone = new FacetHttpParams({ fromString: httpParamsClone.toString() });
        return clone;
    }

    appendDictionary(params: {
        [name: string]: string
    }): FacetHttpParams {
        let clone = new FacetHttpParams({ fromString: super.toString() });
        if (params != null) {
            const keys = Object.keys(params);

            if (keys != null && keys.length) {
                keys.forEach(key => {
                    if (params[key] != null && params[key] !== '') {
                        clone = clone.append(key, params[key].toString());
                    }
                });
            }
        }
        return clone;
    }
}
