import { SystemException} from "./index"
import {NatureErrors} from "./NatureErrors.enum"
import  { type SelectedSpecificity } from "./specificity";



export class DomainException extends SystemException {
  constructor(message: string, specificity: SelectedSpecificity<NatureErrors.DOMAIN>) {
    super(message, NatureErrors.DOMAIN, specificity);
  }
}


export class NegotiateException extends SystemException {
   constructor(message: string, specificity: SelectedSpecificity<NatureErrors.NEGOTIATE>) {
    super(message, NatureErrors.NEGOTIATE, specificity);
  }
}

export class DbException extends SystemException {
   constructor(message: string, specificity: SelectedSpecificity<NatureErrors.DATABASE>,e?: Error) {
    super(message, NatureErrors.DATABASE, specificity, e);
  }
}

