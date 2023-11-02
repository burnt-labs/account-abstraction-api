import { Router } from 'express';
import instantiateContractJwtRouter from './instantiateContractJwt';
import instantiateContractArbRouter from './instantiateContractArb';

const router = Router();

router.use(instantiateContractJwtRouter);
router.use(instantiateContractArbRouter);

export default router;
