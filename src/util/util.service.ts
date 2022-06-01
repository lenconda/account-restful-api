import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as md5 from 'blueimp-md5/js/md5';
import { CaseTransformerService } from '@pugio/case-transformer';

@Injectable()
export class UtilService {
    public transformCaseStyle: typeof CaseTransformerService.prototype.transformCaseStyle;
    public transformDAOToDTO: typeof CaseTransformerService.prototype.transformDAOToDTO;
    public transformDTOToDAO: typeof CaseTransformerService.prototype.transformDTOToDAO;

    public constructor() {
        const transformerService = new CaseTransformerService();
        this.transformCaseStyle = transformerService.transformCaseStyle.bind(this);
        this.transformDAOToDTO = transformerService.transformDAOToDTO.bind(this);
        this.transformDTOToDAO = transformerService.transformDTOToDAO.bind(this);
    }

    public getGravatarUrl(email: string, parameters = {}) {
        const getQueryString = (parameters: Record<string, any>) => {
            let result = '';
            const convertedQueryString = querystring.stringify(parameters);

            if (convertedQueryString !== '') {
                result = '?' + convertedQueryString;
            }

            return result;
        };

        const query = getQueryString(parameters);

        return `https://sdn.geekzu.org/avatar/${md5(email.toLowerCase().trim())}${query}`;
    }
}
